import { Prisma } from "@prisma/client";
import { inferAsyncReturnType } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  createTRPCContext,
} from "~/server/api/trpc";

export const clubRouter = createTRPCRouter({
  create: protectedProcedure.input(z.object({ name: z.string().min(3).max(21), description: z.string() })).mutation(async ({ input: { name, description }, ctx }) => {
    const currentUser = ctx.session.user
    const club = await ctx.prisma.club.create({ data: { name, description, creatorId: currentUser.id } })
    return club
  }),

  getInfinitePostsOfClub: publicProcedure.input(z.object({ name: z.string(), limit: z.number().optional(), cursor: z.object({ id: z.string(), createdAt: z.date() }).optional() }))
    .query(async ({ input: { name, limit = 10, cursor }, ctx }) => {
      const posts = await ctx.prisma.post.findMany({
        where: {
          club: {
            name
          }
        },
        take: limit + 1,
        cursor: cursor ? { createdAt_id: cursor } : undefined,
        orderBy: [{ createdAt: 'desc' }, { 'id': 'desc' }],
        select: {
          id: true,
          title: true,
          createdAt: true,
          content: true,
          club: { select: { name: true } },
          votes: true,
          _count: { select: { comments: true } },
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
            title: post.title,
            content: post.content,
            club: post.club,
            createdAt: post.createdAt,
            user: post.author,
            votes: post.votes,
            commentCount: post._count.comments
          }
        }), nextCursor
      }
    }),

  getClubInfo: publicProcedure.input(z.object({ name: z.string() }))
    .query(async ({ input: { name }, ctx }) => {
      const club = await ctx.prisma.club.findFirst({
        where: { name },
        select: {
          id: true,
          name: true,
          createdAt: true,
          description: true,
          creator: {
            select: { name: true, id: true, image: true }
          },
          _count: { select: { subscribers: true } }
        }
      })
      return club
    }),

  subscribeClub: protectedProcedure.input(z.object({ id: z.string(), name: z.string() }))
    .mutation(async ({ input: { id, name }, ctx }) => {
      const currentUserId = ctx.session.user.id
      let addedSubscription
      const subscriptionExists = await ctx.prisma.subscription.findFirst({
        where: {
          userId: currentUserId,
          clubId: id
        }
      })
      if (subscriptionExists) {
        await ctx.prisma.subscription.delete({
          where: {
            userId_clubId: {
              userId: currentUserId,
              clubId: id
            }
          }
        })
        addedSubscription = false
      } else {
        await ctx.prisma.subscription.create({
          data: {
            userId: currentUserId,
            clubId: id
          }
        })
        addedSubscription = true
      }
      void ctx.revalidateSSG?.(`/club/${name}`)
      return addedSubscription
    }),

  isSubscribed: protectedProcedure.input(z.object({ id: z.string() }))
    .query(async ({ input: { id }, ctx }) => {
      const currentUserId = ctx.session.user.id
      const subscriptionExists = await ctx.prisma.subscription.findFirst({
        where: {
          userId: currentUserId,
          clubId: id
        }
      })
      let isSubscriber
      if (subscriptionExists) {
        isSubscriber = true
      } else {
        isSubscriber = false
      }
      return isSubscriber
    }),

  getClubList: protectedProcedure.query(async ({ ctx }) => {
    const currentUserId = ctx.session.user.id
    const clubs = await ctx.prisma.club.findMany({
      where: {
        OR: [
          {
            subscribers: {
              some: {
                userId: currentUserId,
              },
            },
          },
          {
            creatorId: currentUserId
          }
        ]
      },
    })
    return clubs
  })
});

