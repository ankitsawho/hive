import { useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Separator } from "./ui/separator"
import { Badge } from "./ui/badge"
import Link from "next/link"
import { VoteType } from "@prisma/client"
import { useSession } from "next-auth/react";
import { EditorOutput } from "./EditorOutput"
import { PostInteractions } from "./PostInteractions"


type Post = {
    id: string
    club: { name: string }
    title: string
    createdAt: Date
    votes: {
        userId: string
        postId: string
        type: VoteType
    }[]
    content: any
    user: { id: string, image: string | null, name: string | null },
    commentCount: number
}


const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" })

const PostCard = (post: Post) => {
    const { data: session } = useSession()
    const pRef = useRef<HTMLParagraphElement>(null)
    const votesCount = post.votes.reduce((acc, vote) => {
        if (vote.type === 'UP') return acc + 1
        if (vote.type === 'DOWN') return acc - 1
        return acc
    }, 0)
    const currentVote = post.votes.find(
        (vote) => vote.userId === session?.user.id
    )
    return <Card className="mb-1 mx-1">
        <CardHeader>
            <div className="flex items-center">
                <Avatar>
                    {post.user.image && <AvatarImage src={post.user.image} />}
                    <AvatarFallback>{post.user.name?.toString().toUpperCase().slice(0, 1)}</AvatarFallback>
                </Avatar>
                <CardDescription className="ml-2"><Link href={`/profile/${post.user.id}`} className="hover:underline underline-offset-4 cursor-pointer">{post.user.name}</Link>{" · "}{dateTimeFormatter.format(post.createdAt)}{" · "}<Link href={`/club/${post.club.name}`}><Badge variant="secondary">{post.club.name}</Badge></Link></CardDescription>
            </div>
        </CardHeader>
        <Separator />
        <Link className="hover:opacity-75" href={`/post/${post.id}`}>
            <CardTitle className="mx-6 py-4">{post.title}</CardTitle>
            <CardContent>
                <div
                    className='relative text-md max-h-96 w-full overflow-clip'
                    ref={pRef}>
                    <EditorOutput content={post.content} />
                    <div className='absolute bottom-0 left-0 h-20 w-full bg-gradient-to-t from-white to-transparent'></div>
                </div>
            </CardContent>
        </Link>
        <CardFooter>
            <PostInteractions commentCount={post.commentCount} postId={post.id} initialVotesCount={votesCount} initialVote={currentVote?.type} />
        </CardFooter>
    </Card>
}

export default PostCard

