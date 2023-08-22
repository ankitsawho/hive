import { VoteType } from "@prisma/client"
import { api } from "~/utils/api"
import { toast } from "./ui/use-toast"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { BiCommentDots, BiDownvote, BiSolidDownvote, BiSolidUpvote, BiUpvote } from "react-icons/bi"
import { Button } from "./ui/button"
import Link from "next/link"


type PostInteractionsProps = {
    postId: string
    initialVotesCount: number
    initialVote?: VoteType
    newPage?: boolean
    commentCount: number
}

export const PostInteractions = ({ postId, commentCount, initialVotesCount, initialVote, newPage = false }: PostInteractionsProps) => {
    const postVote = api.post.postVote.useMutation({
        onSuccess: () => {
            toast({
                title: "VOTED !!!",
            })

        },
        onError: () => {
            toast({
                title: "ERROR",
                description: "Couldn't update votes"
            })
            setVote(prevVote)
            setVoteCount(prevVoteCount)
        }
    })
    const { data: session } = useSession()
    const [voteCount, setVoteCount] = useState(initialVotesCount)
    const [vote, setVote] = useState(initialVote)
    const [prevVoteCount, setPrevVoteCount] = useState(initialVotesCount)
    const [prevVote, setPrevVote] = useState(initialVote)

    useEffect(() => {
        setVote(initialVote)
    }, [initialVote])

    const handleUpVote = () => {
        if (!vote) {
            setVote('UP')
            setVoteCount(prev => {
                setPrevVoteCount(prev)
                return prev + 1
            })
            setPrevVote(undefined)
        } else {
            if (vote == 'UP') {
                setVote(undefined)
                setVoteCount(prev => {
                    setPrevVoteCount(prev)
                    return prev - 1
                })
                setPrevVote('UP')
            } else {
                setVote('UP')
                setVoteCount(prev => {
                    setPrevVoteCount(prev)
                    return prev + 2
                })
                setPrevVote('DOWN')
            }
        }
        postVote.mutate({ postId, voteType: 'UP' })
    }

    const handleDownVote = () => {
        if (!vote) {
            setVote('DOWN')
            setVoteCount(prev => {
                setPrevVoteCount(prev)
                return prev - 1
            })
            setPrevVote(undefined)
        } else {
            if (vote == 'DOWN') {
                setVote(undefined)
                setVoteCount(prev => {
                    setPrevVoteCount(prev)
                    return prev + 1
                })
                setPrevVote('DOWN')
            } else {
                setVote('DOWN')
                setVoteCount(prev => {
                    setPrevVoteCount(prev)
                    return prev - 2
                })
                setPrevVote('UP')
            }
        }
        postVote.mutate({ postId, voteType: 'DOWN' })
    }
    const ICON_SIZE = newPage ? 32 : 22
    return <div className="flex items-center justify-between w-full">
        {session ? <div className="flex justify-center items-center space-x-1">
            <div className="flex flex-col">
                <button className="text-slate-600" onClick={handleUpVote}>{vote === 'UP' ? <BiSolidUpvote className=" text-blue-400" size={ICON_SIZE} /> : <BiUpvote size={ICON_SIZE} />}</button>
                <button className="text-slate-600" onClick={handleDownVote}>{vote === 'DOWN' ? <BiSolidDownvote className=" text-red-400" size={ICON_SIZE} /> : <BiDownvote size={ICON_SIZE} />}</button></div>
            <span className="text-sm text-slate-600 font-bold">{voteCount}{"  "}{newPage && getPlural(voteCount, "Vote", "Votes")}</span>
        </div>
            :
            <div className="flex justify-center items-center space-x-1">
                <BiUpvote size={20} className="text-slate-400 cursor-not-allowed" />
                <span className="text-sm text-slate-600 font-bold">{initialVotesCount}</span>
                <BiDownvote size={20} className="text-slate-400 cursor-not-allowed" />
            </div>}
        {!newPage && <Link href={`/post/${postId}`}><Button variant='ghost' className="flex justify-center space-x-2 items-center"><BiCommentDots size={22} /><span>{commentCount}</span></Button></Link>}
    </div>
}



const pluralRules = new Intl.PluralRules()
const getPlural = (number: number, singular: string, plural: string) => {
    return pluralRules.select(number) === "one" ? singular : plural
}
