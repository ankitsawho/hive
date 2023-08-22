import { GetStaticPaths, GetStaticPropsContext, InferGetStaticPropsType, NextPage } from 'next';
import Head from 'next/head';
import Editor from '~/components/Editor';
import { ssgHelper } from '~/server/api/ssgHelper';
import { api } from '~/utils/api';

const Page: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ club }) => {
    const clubDetails = api.club.getClubInfo.useQuery({ name: club })
    return <>
        <Head>
            <title>Hive</title>
            <meta name="description" content="Community based web app" />
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <main className='w-full flex justify-center'>
            {clubDetails.data && <Editor clubName={club} clubId={clubDetails.data?.id} />}
        </main>
    </>
}

export const getStaticPaths: GetStaticPaths = () => {
    return {
        paths: [],
        fallback: 'blocking'
    }
}

export async function getStaticProps(context: GetStaticPropsContext<{ club: string }>) {
    const club = context.params?.club
    if (club == null) {
        return {
            redirect: {
                destination: "/"
            }
        }
    }

    const ssg = ssgHelper()
    await ssg.club.getClubInfo.prefetch({ name: club })

    return {
        props: {
            club,
            trpcState: ssg.dehydrate()
        }
    }
}

export default Page