import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

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

    if (uploadError) return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage
      .from('trade-screenshots')
      .getPublicUrl(path)

    await supabase.from('trades').update({ screenshot_url: publicUrl }).eq('id', id).eq('user_id', user.id)

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const extensions = ['jpeg', 'png', 'webp']
    for (const ext of extensions) {
      await supabase.storage.from('trade-screenshots').remove([`${user.id}/${id}.${ext}`])
    }

    await supabase.from('trades').update({ screenshot_url: null }).eq('id', id).eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
