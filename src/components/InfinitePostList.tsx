import { LoadingSpinner } from "./LoadingSpinner"
import InfiniteScroll from "react-infinite-scroll-component"
import PostCard from "./PostCard"
import type { VoteType } from "@prisma/client"

type Post = {
    id: string
    title: string
    createdAt: Date
    votes: {
        userId: string
        postId: string
        type: VoteType
    }[]
    content: any
    club: { name: string }
    user: { id: string, image: string | null, name: string | null },
    commentCount: number
}

type InfinitePostListProps = {
    isLoading: boolean
    isError: boolean
    hasMore: boolean | undefined
    fetchNewPosts: () => Promise<unknown>
    posts?: Post[]
}

const InfinitePostList = ({ posts, isError, isLoading, fetchNewPosts, hasMore = false }: InfinitePostListProps) => {
    if (isLoading) return <LoadingSpinner />
    if (isError) return <h1>Error...</h1>
    if (posts == null || posts.length == 0) return <h1 className="flex justify-center p-2 text-slate-400 font-bold">No Posts</h1>

    return <ul>
        <InfiniteScroll dataLength={posts.length} next={fetchNewPosts} hasMore={hasMore} loader={<LoadingSpinner />}>
            {
                posts.map(post => {
                    return (
                        <PostCard key={post.id} {...post} />
                    )
                })
            }
        </InfiniteScroll>
    </ul>
}

export default InfinitePostList