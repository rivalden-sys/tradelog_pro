import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    if (tradeError || !trade) {
      return NextResponse.json({ success: false, error: 'Trade not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 })
    if (file.size > 2 * 1024 * 1024) return NextResponse.json({ success: false, error: 'File too large (max 2MB)' }, { status: 400 })

    const ext = file.type.split('/')[1]
    const path = `${user.id}/${id}.${ext}`
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('trade-screenshots')
      .upload(path, buffer, { contentType: file.type, upsert: true })
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('trade-screenshots')
      .getPublicUrl(path)

    const { error: dbError } = await supabase
      .from('trades')
      .update({ screenshot_url: publicUrl })
      .eq('id', id)
      .eq('user_id', user.id)

    if (dbError) {
      // Rollback: remove uploaded file to prevent orphan
      await supabase.storage.from('trade-screenshots').remove([path])
      console.error('DB update error after upload, rolled back storage:', dbError)
      return NextResponse.json({ success: false, error: 'Failed to save screenshot' }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error) {
    console.error('Upload POST error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', id)
      .single()
    if (tradeError || !trade) {
      return NextResponse.json({ success: false, error: 'Trade not found' }, { status: 404 })
    }

    const extensions = ['jpeg', 'png', 'webp']
    for (const ext of extensions) {
      await supabase.storage.from('trade-screenshots').remove([`${user.id}/${id}.${ext}`])
    }

    await supabase.from('trades').update({ screenshot_url: null }).eq('id', id).eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Upload DELETE error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
