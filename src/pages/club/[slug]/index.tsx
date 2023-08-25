import { Cake } from 'lucide-react';
import { GetStaticPaths, GetStaticPropsContext, InferGetStaticPropsType, NextPage } from 'next';
import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import InfinitePostList from '~/components/InfinitePostList';
import { LoadingSpinner } from '~/components/LoadingSpinner';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { api } from '~/utils/api';

const Page: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ slug }) => {
    const { data: session } = useSession()
    const posts = api.club.getInfinitePostsOfClub.useInfiniteQuery({ name: slug }, {
        getNextPageParam: (lastPage) => lastPage.nextCursor
    })
    const clubDetails = api.club.getClubInfo.useQuery({ name: slug })
    return <>
        <Head>
            <title>{slug} | Hive</title>
            <meta name="description" content="Community based web app" />
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <main className="flex justify-center">
            <div className='flex-1 max-w-2xl h-44'>
                <Card className='flex justify-between bg-slate-100 px-4 mx-1 mb-4 items-center gap-3 py-10'>
                    <span className=' text-4xl font-bold text-slate-800'>{clubDetails.data?.name}</span>
                    {session && clubDetails.data && clubDetails.data.creator?.id != session?.user.id && <SubscriptionButton clubName={clubDetails.data.name} clubId={clubDetails.data?.id} />}
                </Card>
                {/* My Feed */}
                <div className="">
                    <InfinitePostList posts={posts.data?.pages.flatMap(page => page.posts)} isError={posts.isError} isLoading={posts.isLoading} hasMore={posts.hasNextPage} fetchNewPosts={posts.fetchNextPage} />
                </div>
            </div>
            {/* SideBar */}
            {clubDetails.data && <ClubSidebar session={session} details={clubDetails.data} />}
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

type ClubSidebarProps = {
    session: Session | null
    details: {
        name: string;
        description: string;
        id: string;
        createdAt: Date;
        creator: {
            name: string | null;
            id: string;
            image: string | null;
        } | null;
        _count: {
            subscribers: number;
        };
    }
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "long" })


const ClubSidebar = ({ session, details }: ClubSidebarProps) => {
    const isSubscribed = api.club.isSubscribed.useQuery({ id: details.id })
    const creatorId = details.creator?.id
    return <>{
        <Card className="max-w-xs hidden md:block w-full">
            <CardHeader>
                <CardTitle className="flex gap-2 items-center"><span>{details.name}</span></CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
                <CardDescription>{details.description}</CardDescription>
                <CardDescription className='flex gap-1 items-center'><Cake /> <p>Created {dateTimeFormatter.format(details.createdAt)}</p></CardDescription>
                <CardDescription>{details._count.subscribers}{" "}{getPlural(details._count.subscribers, "member", "members")}</CardDescription>
                <div className='flex items-center bg-slate-100 p-2 rounded-lg space-x-2'>
                    <Link href={`/profile/${details.creator?.id}`}><Avatar>
                        {details.creator?.image && <AvatarImage src={details.creator.image} />}
                        <AvatarFallback>{details.creator?.name?.toString().toUpperCase().slice(0, 1)}</AvatarFallback>
                    </Avatar></Link>
                    <CardDescription className="ml-2"><Link href={`/profile/${details.creator?.id}`} className="hover:underline underline-offset-4 cursor-pointer">{details.creator?.name}</Link></CardDescription>
                    <Link href={`/profile/${details.creator?.id}`}><Badge>Creator</Badge></Link>
                </div>
            </CardContent>
            {(session?.user && (session.user.id == creatorId || isSubscribed.data)) && <CardFooter>
                <Link className="w-full mb-2" href={`/create/${details.name}`}><Button variant="outline" className='w-full'>Create Post</Button></Link>
            </CardFooter>}
        </Card>
    }</>
}

type SubscriptionButtonProps = {
    clubId: string
    clubName: string
}

const SubscriptionButton = ({ clubId, clubName }: SubscriptionButtonProps) => {
    const trpcUtils = api.useContext()

    const toggleSubscription = api.club.subscribeClub.useMutation({
        onSuccess: (addedSubscription) => {
            trpcUtils.club.isSubscribed.setData({ id: clubId }, () => {
                trpcUtils.club.getClubInfo.setData({ name: clubName }, (oldData) => {
                    if (oldData != null)
                        return {
                            ...oldData,
                            _count: {
                                subscribers: addedSubscription ? oldData?._count.subscribers + 1 : oldData?._count.subscribers - 1
                            }
                        }
                })
                return addedSubscription
            })
        }
    })
    const isSubscribed = api.club.isSubscribed.useQuery({ id: clubId })
    return !toggleSubscription.isLoading ? <Button onClick={() => toggleSubscription.mutate({ id: clubId, name: clubName })}>{isSubscribed.data ? "Leave" : "Join"}</Button> : <LoadingSpinner />
}

const pluralRules = new Intl.PluralRules()
const getPlural = (number: number, singular: string, plural: string) => {
    return pluralRules.select(number) === "one" ? singular : plural
}

export default Page