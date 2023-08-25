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
                    },
                    votes: true
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
                comments: comments.map(comment => {
                    return {
                        id: comment.id,
                        text: comment.text,
                        author: comment.author,
                        createdAt: comment.createdAt,
                        votes: comment.votes
                    }
                }), nextCursor
            }
        }),

    commentVote: protectedProcedure.input(z.object({ commentId: z.string(), voteType: z.enum(['UP', 'DOWN']) }))
        .mutation(async ({ input: { commentId, voteType }, ctx }) => {
            const currentUser = ctx.session.user
            const existingVote = await ctx.prisma.commentVote.findFirst({
                where: {
                    userId: currentUser.id,
                    commentId
                }
            })

            if (existingVote) {
                if (existingVote.type === voteType) {
                    await ctx.prisma.commentVote.delete({
                        where: {
                            userId_commentId: {
                                commentId,
                                userId: currentUser.id
                            }
                        }
                    })
                } else {
                    await ctx.prisma.commentVote.update({
                        where: {
                            userId_commentId: {
                                commentId,
                                userId: currentUser.id
                            }
                        },
                        data: {
                            type: voteType
                        }
                    })
                    return { message: "OK" }
                }
            }
            await ctx.prisma.commentVote.create({
                data: {
                    type: voteType,
                    userId: currentUser.id,
                    commentId,
                },
            })
            return { message: "OK" }
        }),

});

