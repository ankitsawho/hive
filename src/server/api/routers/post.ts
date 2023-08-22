import { z } from "zod";
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
    create: protectedProcedure.input(z.object({ title: z.string(), content: z.any(), clubId: z.string() })).mutation(async ({ input: { title, content, clubId }, ctx }) => {
        const currentUser = ctx.session.user
        const club = await ctx.prisma.post.create({ data: { title, content, authorId: currentUser.id, clubId } })
        return club
    }),

    getInfinitePostsUserFeed: publicProcedure.input(z.object({ limit: z.number().optional(), cursor: z.object({ id: z.string(), createdAt: z.date() }).optional() }))
        .query(async ({ input: { limit = 10, cursor }, ctx }) => {
            const currentUser = ctx.session?.user
            const posts = await ctx.prisma.post.findMany({
                where: {
                    club: {
                        OR: [
                            {
                                subscribers: {
                                    some: {
                                        userId: currentUser?.id,
                                    },
                                },
                            },
                            {
                                creatorId: currentUser?.id
                            }
                        ]
                    },
                },
                take: limit + 1,
                cursor: cursor ? { createdAt_id: cursor } : undefined,
                orderBy: [{ createdAt: 'desc' }, { 'id': 'desc' }],
                select: {
                    club: { select: { name: true } },
                    id: true,
                    title: true,
                    createdAt: true,
                    content: true,
                    _count: { select: { comments: true } },
                    votes: true,
                    author: {
                        select: { name: true, id: true, image: true }
                    }
                }
            })
            let nextCursor: typeof cursor | undefined
            if (posts.length > limit) {
                const nextItem = posts.pop()
                if (nextItem != null) {
                    nextCursor = { id: nextItem.id, createdAt: nextItem.createdAt }
                }
            }
            return {
                posts: posts.map(post => {
                    return {
                        id: post.id,
                        club: post.club,
                        title: post.title,
                        content: post.content,
                        createdAt: post.createdAt,
                        user: post.author,
                        votes: post.votes,
                        commentCount: post._count.comments
                    }
                }), nextCursor
            }
        }),

    postVote: protectedProcedure.input(z.object({ postId: z.string(), voteType: z.enum(['UP', 'DOWN']) })).mutation(async ({ input: { postId, voteType }, ctx }) => {
        const currentUser = ctx.session.user
        const existingVote = await ctx.prisma.vote.findFirst({
            where: {
                userId: currentUser.id,
                postId
            }
        })

        const post = await ctx.prisma.post.findUnique({
            where: {
                id: postId
            },
            include: {
                author: true,
                votes: true
            }
        })

        if (!post) {
            return { error: "Post doesn't exists" }
        }

        if (existingVote) {
            if (existingVote.type === voteType) {
                await ctx.prisma.vote.delete({
                    where: {
                        userId_postId: {
                            postId,
                            userId: currentUser.id
                        }
                    }
                })
            }
            else {
                await ctx.prisma.vote.update({
                    where: {
                        userId_postId: {
                            postId,
                            userId: currentUser.id
                        }
                    },
                    data: {
                        type: voteType
                    }
                })
            }
            const voteCount = post.votes.reduce((acc, vote) => {
                if (vote.type === 'UP') return acc + 1
                if (vote.type === 'DOWN') return acc - 1
                return acc
            }, 0)
            return { voteCount }
        }

        await ctx.prisma.vote.create({
            data: {
                type: voteType,
                userId: currentUser.id,
                postId,
            },
        })
        const voteCount = post.votes.reduce((acc, vote) => {
            if (vote.type === 'UP') return acc + 1
            if (vote.type === 'DOWN') return acc - 1
            return acc
        }, 0)
        return { voteCount }
    }),

    getPostInfo: publicProcedure.input(z.object({ postId: z.string() })).query(async ({ input: { postId }, ctx }) => {
        const post = await ctx.prisma.post.findFirst({
            where: { id: postId },
            select: {
                id: true,
                title: true,
                content: true,
                createdAt: true,
                votes: true,
                author: {
                    select: { name: true, id: true, image: true }
                },
                _count: { select: { comments: true } },
                club: { select: { name: true, id: true } },
            }
        })
        return post
    }),
});

