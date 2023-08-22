import { useState } from "react"
import { Button } from "./ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { api } from "~/utils/api"
import { Loader } from "lucide-react"
import { toast } from "./ui/use-toast"
import { useRouter } from "next/router"

const CreateClubDialog = () => {
    const [clubName, setClubName] = useState<string>("")
    const [clubDesc, setClubDesc] = useState<string>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [open, setOpen] = useState<boolean>(false)
    const router = useRouter()

    const createClub = api.club.create.useMutation({
        onSuccess: (newClub) => {
            toast({
                title: "Success",
                description: "Club created",
            })
            router.push(`/club/${clubName}`)
        },
        onError: (error) => {
            if (error.data?.httpStatus == 400) {
                toast({
                    title: "Error",
                    description: "Invalid club name",
                })
            } else if (error.data?.httpStatus == 500) {
                toast({
                    title: "Error",
                    description: "Club name already exists",
                })
            } else {
                toast({
                    title: "Error"
                })
            }
            setIsLoading(false)
            setOpen(false)
        },
    })

    const handleCreateClub = async () => {
        if (clubName.length < 3) return
        setIsLoading(true)
        createClub.mutate({ name: clubName, description: clubDesc })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" className="w-full">Create Club</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create a club</DialogTitle>
                    <DialogDescription>
                        Club names including capitalization cannot be changed.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input value={clubName} onChange={(e) => setClubName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Description
                        </Label>
                        <Input value={clubDesc} onChange={(e) => setClubDesc(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    {isLoading ? <Loader className="animate-spin" /> : <Button type="button" onClick={handleCreateClub}>Create</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default CreateClubDialog