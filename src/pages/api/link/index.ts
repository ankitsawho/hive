import axios from 'axios'
import { NextApiRequest, NextApiResponse } from 'next';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const urlQuery = req.query.url as string;
    const url = new URL(urlQuery)
    const href = url.href
    if (href == null) {
        res.status(400).json({ error: 'Invalid href' })
        return
    }

    const result = await axios.get(href)

    const titleMatch = result.data.match(/<title>(.*?)<\/title>/)
    const title = titleMatch ? titleMatch[1] : ''

    const descriptionMatch = result.data.match(
        /<meta name="description" content="(.*?)"/
    )
    const description = descriptionMatch ? descriptionMatch[1] : ''

    const imageMatch = result.data.match(/<meta property="og:image" content="(.*?)"/)
    const imageUrl = imageMatch ? imageMatch[1] : ''

    // Return the data in the format required by the editor tool
    res.status(200).json({
        success: 1,
        meta: {
            title,
            description,
            image: {
                url: imageUrl,
            },
        },
    })
}  