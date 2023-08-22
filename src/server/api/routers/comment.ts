import { text } from "stream/consumers";
import { z } from "zod";
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
} from "~/server/api/trpc";

export const commentRouter = createTRPCRouter({
    createCommentOnPost: protectedProcedure.input(z.object({ postId: z.string(), text: z.string() })).mutation(async ({ input: { postId, text }, ctx }) => {
        const currentUser = ctx.session.user
        const comment = await ctx.prisma.comment.create({ data: { postId, authorId: currentUser.id, text } })
        return comment
    }),

    getInfiniteComment: publicProcedure.input(z.object({ postId: z.string(), limit: z.number().optional(), cursor: z.object({ id: z.string(), createdAt: z.date() }).optional() }))
        .query(async ({ input: { postId, limit = 10, cursor }, ctx }) => {
            const currentUser = ctx.session?.user
            const comments = await ctx.prisma.comment.findMany({
                where: {
                    postId
                },
                take: limit + 1,
                cursor: cursor ? { createdAt_id: cursor } : undefined,
                orderBy: [{ createdAt: 'desc' }, { 'id': 'desc' }],
                select: {
                    id: true,
                    text: true,
                    createdAt: true,
                    author: {
                        select: { name: true, id: true, image: true }
                    }
                }
            })
            let nextCursor: typeof cursor | undefined
            if (comments.length > limit) {
                const nextItem = comments.pop()
                if (nextItem != null) {
                    nextCursor = { id: nextItem.id, createdAt: nextItem.createdAt }
                }
            }
            return {
                comments: comments.map(post => {
                    return {
                        id: post.id,
                        text: post.text,
                        author: post.author,
                        createdAt: post.createdAt
                    }
                }), nextCursor
            }
        }),

    commentVote: protectedProcedure.input(z.object({ postId: z.string(), voteType: z.enum(['UP', 'DOWN']) })).mutation(async ({ input: { postId, voteType }, ctx }) => {
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

});

