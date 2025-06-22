import type { NextApiRequest, NextApiResponse } from "next";
import formidable from 'formidable';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const form = formidable({
        uploadDir: './uploads',
        keepExtensions: true,
        maxFiles: 1,
        maxFileSize: 1024 * 1024 * 5, // 5MB
    });

    form.parse(req, (err: Error, fields: formidable.Fields, files: formidable.Files) => {
        if (err) {
            return res.status(500).json({ error: "Upload failed" });
        }

        const uploadedFile = files.file;
        console.log('File received: ', uploadedFile);

        res.status(200).json({ message: "File uploaded successfully" });
    });
}
