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

const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
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
                form.setError("root", { message: "Failed to retrieve user profile" });
            }
        },
        onError: (error: Error | unknown) => {
            console.error("Login failed", error);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            form.setError("root", { message: (error as any)?.response?.data?.error || "Invalid email or password" });
        }
    });

    function onSubmit(data: LoginFormValues) {
        loginMutation.mutate({
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
                        Enter your email and password to sign in
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            <Button type="submit" disabled={loginMutation.isPending} className="w-full mt-6 bg-[#d97757] hover:bg-[#c4694a] text-white">
                                {loginMutation.isPending ? "Signing in..." : "Sign In"}
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
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="ml-1 text-[#d97757] hover:underline font-medium">
                        Sign up
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
