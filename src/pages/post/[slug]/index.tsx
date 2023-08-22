import { GetStaticPaths, GetStaticPropsContext, InferGetStaticPropsType, NextPage } from "next"
import { useSession } from "next-auth/react"
import Head from "next/head"
import Link from "next/link"
import { FormEvent, useRef, useState } from "react"
import InfiniteScroll from "react-infinite-scroll-component"
import { EditorOutput } from "~/components/EditorOutput"
import { LoadingSpinner } from "~/components/LoadingSpinner"
import { PostInteractions } from "~/components/PostInteractions"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Label } from "~/components/ui/label"
import { Separator } from "~/components/ui/separator"
import { Textarea } from "~/components/ui/textarea"
import { toast } from "~/components/ui/use-toast"
import { api } from "~/utils/api"


const Page: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ slug }) => {
    const session = useSession()
    const post = api.post.getPostInfo.useQuery({ postId: slug }).data
    const votesCount = post ? post.votes.reduce((acc, vote) => {
        if (vote.type === 'UP') return acc + 1
        if (vote.type === 'DOWN') return acc - 1
        return acc
    }, 0) : 0
    const currentVote = post ? post.votes.find(
        (vote) => vote.userId === session.data?.user.id
    ) : undefined
    const pRef = useRef<HTMLParagraphElement>(null)
    if (!post) return <LoadingSpinner />
    return <>
        <Head>
            <title>Post in {post.club.name} club | Hive</title>
            <meta name="description" content="Community based web app" />
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <main>
            <Card className=" m-6">
                <div className="px-6 pt-3">
                    <PostInteractions commentCount={post._count.comments} postId={post.id} initialVotesCount={votesCount} initialVote={currentVote?.type} newPage={true} />
                </div>
                <CardHeader>
                    <div className="flex items-center">
                        <Avatar>
                            {post.author.image && <AvatarImage src={post.author.image} />}
                            <AvatarFallback>{post.author.name?.toString().toUpperCase().slice(0, 1)}</AvatarFallback>
                        </Avatar>
                        <CardDescription className="ml-2"><span className="hover:underline underline-offset-4 cursor-pointer">{post.author.name}</span>{" · "}{dateTimeFormatter.format(post.createdAt)}{" · "}<Link href={`/club/${post.club.name}`}><Badge variant="secondary">{post.club.name}</Badge></Link></CardDescription>
                    </div>
                </CardHeader>
                <Separator />
                <CardTitle className="mx-6 py-4">{post.title}</CardTitle>
                <CardContent>
                    <div
                        className='relative text-md w-full overflow-clip'
                        ref={pRef}>
                        <EditorOutput content={post.content} />
                    </div>
                </CardContent>
            </Card>
            <PostCommentArea postId={post.id} />
            <div className="mx-12 items-center flex space-x-2 my-6 text-slate-800 font-semibold text-lg"><span>Comments</span><Badge>{post._count.comments}</Badge></div>
            <CommentSection postId={post.id} />
        </main>
    </>
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" })

export const getStaticPaths: GetStaticPaths = () => {
    return {
        paths: [],
        fallback: 'blocking'
    }
}

export function getStaticProps(context: GetStaticPropsContext<{ slug: string }>) {
    const slug = context.params?.slug
    if (slug == null) {
        return {
            redirect: {
                destination: "/"
            }
        }
    }
    return {
        props: {
            slug
        }
    }
}

type PostCommentAreaProps = {
    postId: string
}

const PostCommentArea = ({ postId }: PostCommentAreaProps) => {
    const trpcUtils = api.useContext()
    const { data: session } = useSession()
    const [commentText, setCommentText] = useState("")
    const createComment = api.comment.createCommentOnPost.useMutation({
        onSuccess: (newComment) => {
            setCommentText("")
            //@ts-ignore
            trpcUtils.comment.getInfiniteComment.setInfiniteData({ postId }, (oldData) => {
                if (oldData == null || oldData.pages[0] == null) return
                const newCachePost = {
                    ...newComment,
                    author: {
                        id: session?.user.id,
                        name: session?.user.name,
                        image: session?.user.image
                    }
                }
                return {
                    ...oldData,
                    pages: [{
                        ...oldData.pages[0],
                        comments: [newCachePost, ...oldData.pages[0].comments]
                    },
                    ...oldData.pages.slice(1)
                    ]
                }
            })
            trpcUtils.post.getPostInfo.setData({ postId }, (oldData) => {
                if (oldData == null) return
                return {
                    ...oldData,
                    _count: { comments: oldData._count.comments + 1 }
                }
            })
            toast({
                title: "Commented!!!"
            })
        }
    })
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (commentText.length == 0) return
        createComment.mutate({ postId: postId, text: commentText })
    }
    return <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-b px-4 py-2">
        <div className="grid w-full gap-1.5 px-10 mb-10">
            <Label htmlFor="message-2">Your Comment</Label>
            <Textarea placeholder="Type your comment here." value={commentText} onChange={(e) => setCommentText(e.target.value)} autoFocus={false} id="message-2" />
            <p className="text-sm text-muted-foreground">
                Please be respectful.
            </p>
            <Button className="w-fit">Submit</Button>
        </div>
    </form>
}

type CommentSectionProps = {
    postId: string
}

const CommentSection = ({ postId }: CommentSectionProps) => {
    const comments = api.comment.getInfiniteComment.useInfiniteQuery({ postId }, { getNextPageParam: lastPage => lastPage.nextCursor })
    return <InfiniteCommentList comments={comments.data?.pages.flatMap(page => page.comments)} isError={comments.isError} isLoading={comments.isLoading} hasMore={comments.hasNextPage} fetchNewComments={comments.fetchNextPage} />
}

type Comment = {
    id: string
    text: string
    createdAt: Date
    author: { id: string, image: string | null, name: string | null }
}

type InfiniteCommentListProps = {
    isLoading: boolean
    isError: boolean
    hasMore: boolean | undefined
    fetchNewComments: () => Promise<unknown>
    comments?: Comment[]
}



export const InfiniteCommentList = ({ comments, isError, isLoading, fetchNewComments, hasMore = false }: InfiniteCommentListProps) => {
    if (isLoading) return <LoadingSpinner />
    if (isError) return <h1>Error...</h1>
    if (comments == null || comments.length == 0) return <h1 className="flex justify-center p-2 text-slate-400 font-bold">No Comments</h1>

    return <ul>
        <InfiniteScroll dataLength={comments.length} next={fetchNewComments} hasMore={hasMore} loader={<LoadingSpinner />}>
            {
                comments.map(comment => {
                    return (
                        <CommentCard key={comment.id} {...comment} />
                    )
                })
            }
        </InfiniteScroll>
    </ul>
}

const CommentCard = ({ id, text, author, createdAt }: Comment) => {
    return <div className="mx-10 mb-6">
        <div className="flex items-center">
            <Avatar>
                {author.image && <AvatarImage src={author.image} />}
                <AvatarFallback>{author.name?.toString().toUpperCase().slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="ml-2 text-sm font-semibold text-slate-700"><Link href={`/profile/${author.id}`} className="hover:underline underline-offset-4 cursor-pointer">{author.name}</Link>{" · "}{dateTimeFormatter.format(createdAt)}</div>
        </div>
        <div className="mx-10 my-4 text-md text-slate-600">{text}</div>
        <Separator />
    </div>
}

export default Page