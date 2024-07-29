"use server";
import { z } from 'zod';
import { del, put } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getImageById } from './data';


const UploadSchema = z.object({
    title: z.string().min(1),
    image: z
        .instanceof(File)
        .refine((file) => file.size > 0, { message: "Image is required" })
        .refine((file) => file.size === 0 || file.type.startsWith("image/"), { message: "File must be an image" }),
});
const EditSchema = z.object({
    title: z.string().min(1),
    image: z
        .instanceof(File)
        .refine((file) => file.size === 0 || file.type.startsWith("image/"), { message: "File must be an image" })
        .refine((file) => file.size < 4000000, { message: "Ukuran max 3MB" })
        .optional(),
});


export const uploadImage = async (prevState: any, formData: FormData) => {
    const validatedFields = UploadSchema.safeParse(
        Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors
        }
    }

    const { title, image } = validatedFields.data;
    const { url } = await put(image.name, image, {
        access: "public",
        multipart: true
    })

    try {
        await prisma.client.create({
            data: {
                title,
                image: url
            }
        })
    } catch (error) {
        return { message: "Failed to create data" }
    }

    revalidatePath("/");
    redirect("/")
}

export const deleteImage = async (id: string) => {
    const data = await getImageById(id);
    if (!data) {
        return { message: "Data not found" }
    }

    await del(data.image);
    try {
        await prisma.client.delete({
            where: { id }
        })
    } catch (error) {
        return { message: "Failed to delete data" }
    }

    revalidatePath("/");
}

// Update Image
export const updateImage = async (id: string, prevState: unknown, formData: FormData) => {
    const validatedFields = EditSchema.safeParse(
        Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors
        }
    }

    const data = await getImageById(id);
    if (!data) return { message: "Data not found" }

    const { title, image } = validatedFields.data
    let imagePath;
    if (!image || image.size <= 0) {
        imagePath = data.image
    } else {
        await del(data.image);

        const { url } = await put(image.name, image, {
            access: "public",
            multipart: true
        })
        imagePath = url;
    }

    try {
        await prisma.client.update({
            data: {
                title,
                image: imagePath
            },
            where: { id }
        })
    } catch (error) {
        return { message: "Failed to update data" }
    }

    revalidatePath("/");
    redirect("/")
}

