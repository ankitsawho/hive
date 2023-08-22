import { FC, useCallback, useEffect, useState } from 'react'
import { Icon } from './Icon'
import { Button } from './ui/button'
import { signIn, signOut, useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import debounce from 'lodash.debounce'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from './ui/command'
import { api } from '~/utils/api'


const Navbar: FC = () => {
    const { data: sessionData } = useSession()
    const user = sessionData?.user

    return <nav className='fixed w-screen top-0 h-16 flex items-center border-b justify-around py-2 bg-white z-10'>
        <Link href='/'>
            <div className='flex items-center gap-1'>
                <Icon.logo className='h-10 w-10' />
                <p className='font-bold text-lg'>Hive</p>
            </div>
        </Link>
        <SearchBar />
        {
            (user == null) ? <Button onClick={() => {
                signIn()
            }}>Sign In</Button> : <AccountDropdownButton username={user?.name} email={user.email} imageUrl={user?.image} />
        }
    </nav>
}

type AccountDropdownButtonProps = {
    username?: string | null
    imageUrl?: string | null
    email?: string | null
}

const AccountDropdownButton = ({ username, imageUrl, email }: AccountDropdownButtonProps) => {
    const { data: session } = useSession()
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className='flex items-center gap-1 border border-slate-100 py-1 px-2 rounded-lg'>
                <Avatar>
                    {imageUrl && <AvatarImage src={imageUrl} />}
                    <AvatarFallback>{username?.toString().toUpperCase().slice(0, 1)}</AvatarFallback>
                </Avatar>

                <p className='hidden font-bold text-sm md:block'>{username}</p></DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>
                    <p>{username}</p>
                    <p className='text-xs text-slate-600'>{email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href={`/profile/${session?.user.id}`}><DropdownMenuItem className='flex items-center gap-1'><User /> <p className='font-semibold text-xs'>Profile</p></DropdownMenuItem></Link>
                <DropdownMenuItem className='flex items-center gap-1' onClick={() => void signOut()}><LogOut /> <p className='font-semibold text-xs'>Sign Out</p></DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

    )
}

const SearchBar = () => {
    const [input, setInput] = useState("")
    const { data, refetch, isFetched } = api.search.searchClub.useQuery({ query: input }, { enabled: false })
    const debounceRequest = useCallback(() => {
        request()
    }, [])
    const request = debounce(async () => {
        refetch()
    }, 300)

    return <Command className='relative rounded-lg border max-w-lg z-50 overflow-visible'>
        <CommandInput value={input} onValueChange={(text) => {
            setInput(text)
            debounceRequest()
        }} className='outline-none border-none focus:border-none focus:outline-none ring-0' placeholder='Search Hive clubs' />
        {
            input.length > 0 ? <CommandList className='absolute bg-white top-full inset-x-0 shadow rounded-b-md'>
                {isFetched && <CommandEmpty>No results</CommandEmpty>}
                {(data?.length ?? 0) > 0 ? <CommandGroup heading='clubs'>
                    {data?.map((club) => (
                        <CommandItem key={club.id} onSelect={e => setInput("")} value={club.name}><Link href={`/club/${club.name}`} className='w-full h-full'><span>{club.name}</span></Link></CommandItem>
                    ))}
                </CommandGroup> : null}
            </CommandList> : null
        }
    </Command>
}

export default Navbar