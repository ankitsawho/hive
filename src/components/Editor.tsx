import TextareaAutosize from 'react-textarea-autosize'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useRef, useState } from 'react'
import type EditorJs from '@editorjs/editorjs'
import { uploadFiles } from '~/utils/uploadthing'
import { Button } from './ui/button'
import { toast } from './ui/use-toast'
import { api } from '~/utils/api'
import { useRouter } from 'next/router'
import { LoadingSpinner } from './LoadingSpinner'

type EditorProps = {
    clubName: string
    clubId: string
}

const PostValidator = z.object({
    title: z.string().min(3, { message: "Title must be longer than 3 character" }).max(128, { message: "Title must not be longer than 128 characters" }),
    clubId: z.string(),
    content: z.any()
})

type FormData = z.infer<typeof PostValidator>
type PostCreationRequest = z.infer<typeof PostValidator>

const Editor = ({ clubName, clubId }: EditorProps) => {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(PostValidator),
        defaultValues: {
            title: '',
            content: null,
            clubId
        }
    })

    const ref = useRef<EditorJs>()
    const _titleRef = useRef<HTMLTextAreaElement>(null)
    const [isMounted, setIsMounted] = useState<boolean>(false)
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const createPost = api.post.create.useMutation({
        onSuccess: () => {
            router.push(`/club/${clubName}`)
        },
        onError: (error) => {
            toast({
                title: 'Something went wrong',
                description: error.message
            })
        }
    })

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsMounted(true)
        }
    }, [])

    useEffect(() => {
        console.log("ERROR", errors);

        if (Object.keys(errors).length) {
            for (const [_key, value] of Object.entries(errors)) {
                toast({
                    title: 'Something went wrong',
                    description: (value as { message: string }).message
                })
            }
        }
    }, [errors])



    const initializeEditor = useCallback(async () => {
        const EditorJS = (await import("@editorjs/editorjs")).default  //@ts-ignore
        const Header = (await import("@editorjs/header")).default  //@ts-ignore
        // const Embed = (await import("@editorjs/embed")).default  //@ts-ignore
        // const Table = (await import("@editorjs/table")).default  //@ts-ignore
        const List = (await import("@editorjs/list")).default  //@ts-ignore
        const Code = (await import("@editorjs/code")).default  //@ts-ignore
        const LinkTool = (await import("@editorjs/link")).default  //@ts-ignore
        const InlineCode = (await import("@editorjs/inline-code")).default  //@ts-ignore
        const ImageTool = (await import("@editorjs/image")).default

        if (!ref.current) {
            const editor = new EditorJS({
                holder: 'editor',
                onReady() {
                    ref.current = editor
                },
                placeholder: 'Type here to write your post ...',
                inlineToolbar: true,
                data: { blocks: [] },
                tools: {
                    header: Header,
                    // TODO: FIX URL
                    linkTool: {
                        class: LinkTool,
                        config: {
                            endpoint: '/api/link',
                        }
                    },
                    image: {
                        class: ImageTool,
                        config: {
                            async uploadByFile(file: File) {
                                const res = await uploadFiles({
                                    files: [file],
                                    endpoint: "imageUploader",
                                });
                                //TODO: FIX Image upload
                                return {
                                    success: 1,
                                    file: {
                                        url: 'https://codex.so/upload/redactor_images/o_e48549d1855c7fc1807308dd14990126.jpg',
                                    }
                                }
                            }
                        }
                    },
                    list: List,
                    code: Code,
                    inlineCode: InlineCode,
                    // table: Table,
                    // embed: Embed
                }
            })
        }
    }, [])

    useEffect(() => {
        const init = async () => {
            await initializeEditor()
            setTimeout(() => {
                // set focus to title
                _titleRef.current?.focus()
            }, 0)
        }
        if (isMounted) {
            init()
            return () => {
                ref.current?.destroy()
                ref.current = undefined
            }
        }
    }, [isMounted, initializeEditor])

    if (!isMounted) {
        return null
    }

    const onSubmit = async (data: FormData) => {
        setIsLoading(true)
        const blocks = await ref.current?.save()
        const title = data.title
        const payload: PostCreationRequest = {
            title,
            content: blocks,
            clubId
        }
        createPost.mutate(payload)
        setIsLoading(false)
    }

    const { ref: titleRef, ...rest } = register('title')


    return <div className="max-w-5xl w-full">
        <div className="text-slate-700 m-4 text-2xl">Create Post in club <span className="font-bold">{clubName}</span></div>
        <form id='club-post-form' onSubmit={handleSubmit(onSubmit)}>
            <div className='w-full border border-slate-200 p-4 rounded-lg'>
                <div className="prose prose-stone w-full dark:prose-invert">
                    <TextareaAutosize ref={(e) => {
                        titleRef(e)
                        // @ts-ignore
                        _titleRef.current = e
                    }} {...rest} placeholder='Title' className='w-full mx-4 resize-none appearance-none overflow-hidden bg-transparent text-5xl font-bold focus:outline-none' />
                    <div id='editor' className='min-h-[300px] w-full mx-4' />
                </div>
            </div>
            {isLoading ? <LoadingSpinner /> : <Button className='mt-2 w-full' onClick={() => {
                console.log(rest);
                console.log()
            }} form='club-post-form' type='submit'>Create Post</Button>}
        </form>
    </div>
}

export default Editor