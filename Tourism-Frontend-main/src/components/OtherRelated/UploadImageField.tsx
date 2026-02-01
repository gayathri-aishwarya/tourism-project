import Image from 'next/image'
import { useState, useEffect } from 'react'

type UploadImageFieldProps = {
    onFileSelect: (file: File) => void
    initialPreview?: string
    fieldType?: 'heroImage' | 'img'
}

export default function UploadImageField({
    onFileSelect,
    initialPreview,
    fieldType = 'heroImage',
}: UploadImageFieldProps) {
    const [preview, setPreview] = useState<string | null>(null)

    useEffect(() => {
        if (initialPreview) {
            setPreview(initialPreview)
        } else {
            setPreview(null)
        }
    }, [initialPreview])

    return (
        <div className='file-upload'>
            <label className='file-upload-label'>
                {fieldType === 'img'
                    ? 'Upload Product Image'
                    : 'Upload Hero Image'}
            </label>
            <input
                type='file'
                name={fieldType}
                accept='image/*'
                className='file-upload-input'
                onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                        setPreview(URL.createObjectURL(file))
                        onFileSelect(file)
                    }
                }}
            />
            {preview ? (
                <Image
                    src={preview}
                    className='file-preview'
                    alt='preview'
                    width={200}
                    height={200}
                />
            ) : null}
        </div>
    )
}
