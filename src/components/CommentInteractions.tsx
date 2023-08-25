import { VoteType } from "@prisma/client"
import { api } from "~/utils/api"
import { toast } from "./ui/use-toast"
import { useSession } from "next-auth/react"
import { FormEvent, useEffect, useState } from "react"
import { BiDownvote, BiSolidDownvote, BiSolidUpvote, BiUpvote } from "react-icons/bi"
import { Button } from "./ui/button"
import { RiReplyLine } from 'react-icons/ri'
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"

type CommentInteractionsProps = {
    postId: string
    commentId: string
    initialVotesCount: number
    initialVote?: VoteType
}

export const CommentInteractions = ({ postId, commentId, initialVotesCount, initialVote }: CommentInteractionsProps) => {
    const { data: session } = useSession()
    const [voteCount, setVoteCount] = useState(initialVotesCount)
    const [vote, setVote] = useState(initialVote)
    const [prevVoteCount, setPrevVoteCount] = useState(initialVotesCount)
    const [prevVote, setPrevVote] = useState(initialVote)
    const [isReplying, setIsReplying] = useState<boolean>(false)
    const [replyText, setReplyText] = useState("")

    //TODO: Comment Reply
    // const createReply = api.comment.creatReplynComment.useMutation({
    //     onSuccess: () => {
    //         setReplyText("")
    //     },
    //     onError: () => {
    //         toast({
    //             title: "Error occurred"
    //         })
    //     }
    // })

    const commentVote = api.comment.commentVote.useMutation({
        onSuccess: () => {
            toast({
                title: "VOTED !!!",
            })

        },
        onError: (error) => {
            console.log(error);

            toast({
                title: "ERROR",
                description: "Couldn't update votes"
            })
            setVote(prevVote)
            setVoteCount(prevVoteCount)
        }
    })

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
        commentVote.mutate({ commentId, voteType: 'UP' })
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
        commentVote.mutate({ commentId, voteType: 'DOWN' })
    }

    //TODO: Comment Reply
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (replyText.length == 0) return
        // createReply.mutate({ postId: commentId, text: replyText, replyToId: commentId })
    }
    return <div>
        <div className="flex items-center justify-between w-full pl-10">
            {session ? <div className="flex justify-center items-center space-x-1">
                <div className="flex items-center">
                    <button className="text-slate-600" onClick={handleUpVote}>{vote === 'UP' ? <BiSolidUpvote className=" text-blue-400" size={22} /> : <BiUpvote size={22} />}</button>
                    <button className="text-slate-600" onClick={handleDownVote}>{vote === 'DOWN' ? <BiSolidDownvote className=" text-red-400" size={22} /> : <BiDownvote size={22} />}</button>
                </div>
                <span className="text-sm text-slate-600 font-bold">{voteCount}{" "}{getPlural(voteCount, "Vote", "Votes")}</span>
                <Button variant="ghost" onClick={() => setIsReplying(prev => !isReplying)} className="flex items-center space-x-1"><RiReplyLine size={20} /><span>Reply</span></Button>
            </div>
                :
                <div className="flex justify-center items-center space-x-1">
                    <BiUpvote size={20} className="text-slate-400 cursor-not-allowed" />
                    <span className="text-sm text-slate-600 font-bold">{initialVotesCount}</span>
                    <BiDownvote size={20} className="text-slate-400 cursor-not-allowed" />
                </div>}
        </div>

        {
            //TODO: Comment Reply
            isReplying && <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-4 py-2">
                <div className="grid w-full gap-1.5 px-10 my-5">
                    <Label htmlFor="message-2" className="text-red-400">This feature will be available soon ⏳</Label>
                    <Textarea placeholder="Type your comment here." value={replyText} onChange={(e) => setReplyText(e.target.value)} autoFocus={false} id="message-2" />
                    {replyText.length > 0 && <Button className="w-fit">Submit</Button>}
                </div>
            </form>
        }
    </div>
}



const pluralRules = new Intl.PluralRules()
const getPlural = (number: number, singular: string, plural: string) => {
    return pluralRules.select(number) === "one" ? singular : plural
}
