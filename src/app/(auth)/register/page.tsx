"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const registerSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const { login } = useAuth();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const router = useRouter();

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const loginMutation = useMutation({
        mutationFn: authApi.login,
        onSuccess: async (data, variables) => {
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            try {
                const user = await authApi.getMe();
                login(user);
            } catch (err) {
                console.error("Failed to fetch user profile", err);
            }
        }
    });

    const registerMutation = useMutation({
        mutationFn: authApi.register,
        onSuccess: (data, variables) => {
            // After successful registration, log them in automatically
            loginMutation.mutate({
                email: variables.email,
                password: variables.password
            });
        },
        onError: (error: Error | unknown) => {
            console.error("Registration failed:", error);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            form.setError("root", { message: (error as any)?.response?.data?.error || "Registration failed" });
        }
    });

    function onSubmit(data: RegisterFormValues) {
        registerMutation.mutate({
            name: data.name,
            email: data.email,
            password: data.password
        });
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-50">
            <Card className="w-full max-w-md shadow-lg border-zinc-200">
                <CardHeader className="space-y-1 pb-6">
                    <CardTitle className="text-2xl font-bold text-center">Chat Bot</CardTitle>
                    <CardDescription className="text-center">
                        Enter your details below to create your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your email" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="Enter your password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="Confirm your password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={registerMutation.isPending || loginMutation.isPending} className="w-full mt-6 bg-[#d97757] hover:bg-[#c4694a] text-white">
                                {registerMutation.isPending || loginMutation.isPending ? "Creating account..." : "Sign Up"}
                            </Button>
                            {form.formState.errors.root && (
                                <p className="text-sm font-medium text-destructive text-center mt-2">
                                    {form.formState.errors.root.message}
                                </p>
                            )}
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-center border-t p-4 text-sm text-zinc-500">
                    Already have an account?{" "}
                    <Link href="/login" className="ml-1 text-[#d97757] hover:underline font-medium">
                        Sign in
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
