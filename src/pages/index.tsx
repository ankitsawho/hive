import Head from "next/head";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card"
import { Button } from "~/components/ui/button";
import { HomeIcon } from "lucide-react";
import CreateClubDialog from "~/components/CreateClubDialog";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { Fragment, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "~/components/ui/command";
import Link from "next/link";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Badge } from "~/components/ui/badge";
import InfinitePostList from "~/components/InfinitePostList";


export default function Home() {
  const { data: session } = useSession()
  const posts = api.post.getInfinitePostsUserFeed.useInfiniteQuery({}, {
    getNextPageParam: (lastPage) => lastPage.nextCursor
  })

  return (
    <>
      <Head>
        <title>Hive</title>
        <meta name="description" content="Community based web app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex justify-center">
        {/* My Feed */}
        <div className="flex-1 max-w-2xl h-44">
          <InfinitePostList posts={posts.data?.pages.flatMap(page => page.posts)} isError={posts.isError} isLoading={posts.isLoading} hasMore={posts.hasNextPage} fetchNewPosts={posts.fetchNextPage} />
        </div>
        {/* SideBar */}
        <div className=" space-y-2">
          <Card className="max-w-xs hidden md:block w-full">
            <CardHeader>
              <CardTitle className="flex gap-2 items-center"><HomeIcon /><p>Home</p></CardTitle>
              <CardDescription>Your personal Hive frontpage. Come here to check in with your favorite clubs.</CardDescription>
            </CardHeader>
            {session != null && <CardContent>
              <ComboboxDemo />
              <CreateClubDialog />
            </CardContent>}
          </Card>
          <ClubListSidebar />
        </div>
      </main>
    </>
  );
}

const ComboboxDemo = () => {
  const [open, setOpen] = useState<boolean>(false)
  const [value, setValue] = useState<string>("")
  const clubList = (api.club.getClubList.useQuery()).data

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-center mb-2"
        >
          {(clubList && value)
            ? clubList.find((club) => club.id == value)?.name
            : "Create Post"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search Club..." />
          <CommandEmpty>No club found.</CommandEmpty>
          <CommandGroup>
            {clubList == null ? <LoadingSpinner /> : clubList.map((club) => (
              <Link href={`/create/${club.name}`} key={club.id}>
                <CommandItem
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  {club.name}
                </CommandItem>
              </Link>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}


const ClubListSidebar = () => {
  const { data: session } = useSession()
  const clubList = (api.club.getClubList.useQuery()).data
  if (!session?.user) return null
  return <ScrollArea className="h-72 w-full rounded-md border hidden md:block">
    <div className="p-4">
      <h4 className="mb-4 text-lg leading-none font-bold">Clubs you joined</h4>
      {clubList == null ? <LoadingSpinner /> : clubList.map((club) => (
        <Fragment key={club.id}>
          <Link href={`/club/${club.name}`} className="text-sm">
            <Card className="mb-1 hover:outline-dashed hover:outline-slate-400 cursor-pointer">
              <CardDescription className="p-3 flex justify-between">
                <div>{club.name}</div>
                {club.creatorId == session?.user.id && <Badge variant="default">Created</Badge>}
              </CardDescription>
            </Card>
          </Link>
        </Fragment>
      ))}
    </div>
  </ScrollArea>
}

