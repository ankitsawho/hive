
import { GetStaticPaths, GetStaticPropsContext, InferGetStaticPropsType, NextPage } from 'next';
import Head from 'next/head';
import InfinitePostList from '~/components/InfinitePostList';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';

import { api } from '~/utils/api';

const Page: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ slug }) => {
    const posts = api.user.getInfinitePostsOfUser.useInfiniteQuery({ userId: slug }, {
        getNextPageParam: (lastPage) => lastPage.nextCursor
    })
    const user = api.user.getUserInfo.useQuery({ userId: slug })
    return <>
        <Head>
            <title>{slug} | Hive</title>
            <meta name="description" content="Community based web app" />
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <main className="flex justify-center">
            <div className='flex-1 max-w-2xl h-44'>
                {/* My Feed */}
                <div className="">
                    <InfinitePostList posts={posts.data?.pages.flatMap(page => page.posts)} isError={posts.isError} isLoading={posts.isLoading} hasMore={posts.hasNextPage} fetchNewPosts={posts.fetchNextPage} />
                </div>
            </div>
            {/* SideBar */}
            {user.data && <ProfileSidebar user={user.data} />}
        </main>
    </>
}

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
            slug,
        }
    }
}

type ProfileSidebarProps = {
    user: {
        name: string | null;
        id: string;
        _count: {
            Post: number;
            subscriptions: number;
            createdClubs: number
        };
        image: string | null;
    }
}


const ProfileSidebar = ({ user }: ProfileSidebarProps) => {
    return <>{
        <Card className="max-w-xs hidden md:block w-full">
            <CardHeader>
                <div className="flex items-center">
                    <Avatar>
                        {user.image && <AvatarImage src={user.image} />}
                        <AvatarFallback>{user.name?.toString().toUpperCase().slice(0, 1)}</AvatarFallback>
                    </Avatar>
                </div>
                <CardTitle className="flex gap-2 items-center"><span>{user.name}</span></CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
                <CardDescription>{user._count.Post}{" "}{getPlural(user._count.Post, "post", "posts")}</CardDescription>
                <CardDescription>{user._count.subscriptions}{" club "}{getPlural(user._count.subscriptions, "membership", "memberships")}</CardDescription>
                <CardDescription>{user._count.createdClubs}{" "}{getPlural(user._count.createdClubs, "club created", "clubs created")}</CardDescription>
            </CardContent>
        </Card>
    }</>
}


const pluralRules = new Intl.PluralRules()
const getPlural = (number: number, singular: string, plural: string) => {
    return pluralRules.select(number) === "one" ? singular : plural
}

export default Page