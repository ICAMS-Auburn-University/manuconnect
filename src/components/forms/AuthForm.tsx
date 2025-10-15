// DELETE THIS FILE
// MOVE SignInForm TO src/components/forms/SignInForm.tsx
// MOVE SignUpForm TO src/components/forms/SignUpForm.tsx

// 'use client';

// import { z } from 'zod';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { useForm } from 'react-hook-form';
// import { Button } from '@/components/ui/button';
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form';
// import { Input } from '@/components/ui/input';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { useState } from 'react';
// import Image from 'next/image';
// import Link from 'next/link';
// import { login, signup } from '@/domain/auth/service';

// import type { LoginData, SignupData } from '@/domain/auth/types';
// import { AccountType } from '@/types/enums';

// type FormType = 'sign-in' | 'sign-up';

// const isNextRedirectError = (error: unknown): error is { digest: string } => {
//   if (typeof error === 'object' && error !== null && 'digest' in error) {
//     const digest = (error as { digest?: unknown }).digest;
//     return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT');
//   }
//   return false;
// };

// const baseSchema = {
//   email: z.string().email(),
//   password: z.string().min(6).max(100),
// };

// const signInSchema = z.object(baseSchema);
// const signUpSchema = signInSchema
//   .extend({
//     firstName: z.string().min(1),
//     lastName: z.string().min(1),
//     accountType: z.enum(['creator', 'manufacturer', 'admin']),
//     confirmPassword: z
//       .string()
//       .min(6, { message: 'Confirm password is required' }),
//     companyName: z.string().min(1, { message: 'Company name is required' }),
//   })
//   .superRefine((data, ctx) => {
//     if (data.password !== data.confirmPassword) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['confirmPassword'],
//         message: 'Passwords must match',
//       });
//     }
//   });

// type SignInFormValues = z.infer<typeof signInSchema>;
// type SignUpFormValues = z.infer<typeof signUpSchema>;

// const AuthForm = ({ type }: { type: FormType }) => {
//   const [isLoading, setisLoading] = useState(false);
//   const [errorMessage, seterrorMessage] = useState('');
//   const [isSuccess, setisSuccess] = useState(false);

//   const schema = type === 'sign-in' ? signInSchema : signUpSchema;

//   const form = useForm<SignInFormValues | SignUpFormValues>({
//     resolver: zodResolver(schema),
//     defaultValues:
//       type === 'sign-in'
//         ? {
//             email: '',
//             password: '',
//           }
//         : {
//             email: '',
//             password: '',
//             firstName: '',
//             lastName: '',
//             accountType: 'creator',
//             confirmPassword: '',
//             companyName: '',
//           },
//   });

//   const onSubmit = async (values: SignInFormValues | SignUpFormValues) => {
//     console.log('form submitted with values:', values);
//     setisLoading(true);
//     seterrorMessage('');
//     console.log('form submitted with values:', values);
//     try {
//       if (type === 'sign-in') {
//         const payload: LoginData = {
//           email: values.email,
//           password: values.password,
//         };

//         await login(payload);
//       } else {
//         const signUpValues = values as SignUpFormValues;
//         const payload: SignupData = {
//           email: signUpValues.email,
//           password: signUpValues.password,
//           firstName: signUpValues.firstName,
//           lastName: signUpValues.lastName,
//           accountType: signUpValues.accountType as AccountType,
//           companyName: signUpValues.companyName,
//         };

//         await signup(payload);
//       }
//     } catch (error) {
//       if (isNextRedirectError(error)) {
//         throw error;
//       }
//       console.error(error);
//       seterrorMessage('Something went wrong. Please try again.');
//     } finally {
//       setisLoading(false);
//     }
//     setisSuccess(true);
//   };

//   return (
//     <>
//       <Form {...form}>
//         <form
//           onSubmit={form.handleSubmit(onSubmit)}
//           className="auth-form max-w-sm"
//         >
//           <h1 className="h1 mb-2 text-[#0c2340]">
//             {type === 'sign-in' ? 'Sign In' : 'Sign Up'}
//           </h1>
//           {type === 'sign-up' && (
//             <div>
//               <FormField
//                 control={form.control}
//                 name="firstName"
//                 render={({ field }) => (
//                   <FormItem>
//                     <div className="shad-form-item">
//                       <FormLabel className="shad-form-label">
//                         First Name
//                       </FormLabel>
//                       <FormControl>
//                         <Input
//                           placeholder="Enter your first name"
//                           className="shad-input"
//                           {...field}
//                         />
//                       </FormControl>
//                     </div>
//                     <FormMessage className="shad-form-message" />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="lastName"
//                 render={({ field }) => (
//                   <FormItem>
//                     <div className="shad-form-item">
//                       <FormLabel className="shad-form-label">
//                         Last Name
//                       </FormLabel>
//                       <FormControl>
//                         <Input
//                           placeholder="Enter your last name"
//                           className="shad-input"
//                           {...field}
//                         />
//                       </FormControl>
//                     </div>
//                     <FormMessage className="shad-form-message" />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="companyName"
//                 render={({ field }) => (
//                   <FormItem className="mt-4">
//                     <div className="shad-form-item">
//                       <FormLabel className="shad-form-label">
//                         Company Name
//                       </FormLabel>
//                       <FormControl>
//                         <Input
//                           placeholder="Enter your company name"
//                           className="shad-input"
//                           {...field}
//                         />
//                       </FormControl>
//                     </div>
//                     <FormMessage className="shad-form-message" />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="accountType"
//                 render={({ field }) => (
//                   <FormItem className="mt-4">
//                     <div className="shad-form-item">
//                       <FormLabel className="shad-form-label">
//                         Account Type
//                       </FormLabel>
//                       <Select
//                         onValueChange={field.onChange}
//                         value={field.value}
//                         defaultValue={field.value}
//                       >
//                         <FormControl>
//                           <SelectTrigger className="shad-input text-left">
//                             <SelectValue placeholder="Select account type" />
//                           </SelectTrigger>
//                         </FormControl>
//                         <SelectContent>
//                           <SelectItem value="creator">Creator</SelectItem>
//                           <SelectItem value="manufacturer">
//                             Manufacturer
//                           </SelectItem>
//                           <SelectItem value="admin">Admin</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>
//                     <FormMessage className="shad-form-message" />
//                   </FormItem>
//                 )}
//               />
//             </div>
//           )}

//           <FormField
//             control={form.control}
//             name="email"
//             render={({ field }) => (
//               <FormItem>
//                 <div className="shad-form-item">
//                   <FormLabel className="shad-form-label">Email</FormLabel>
//                   <FormControl>
//                     <Input
//                       placeholder="Enter your email"
//                       className="shad-input"
//                       {...field}
//                     />
//                   </FormControl>
//                 </div>
//                 <FormMessage className="shad-form-message" />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="password"
//             render={({ field }) => (
//               <FormItem>
//                 <div className="shad-form-item">
//                   <FormLabel className="shad-form-label">Password</FormLabel>
//                   <FormControl>
//                     <Input
//                       placeholder="Enter your password"
//                       className="shad-input"
//                       type="password"
//                       {...field}
//                     />
//                   </FormControl>
//                 </div>
//                 <FormMessage className="shad-form-message" />
//               </FormItem>
//             )}
//           />

//           {type === 'sign-up' && (
//             <FormField
//               control={form.control}
//               name="confirmPassword"
//               render={({ field }) => (
//                 <FormItem>
//                   <div className="shad-form-item">
//                     <FormLabel className="shad-form-label">
//                       Confirm Password
//                     </FormLabel>
//                     <FormControl>
//                       <Input
//                         placeholder="Re-enter your password"
//                         className="shad-input"
//                         type="password"
//                         {...field}
//                       />
//                     </FormControl>
//                   </div>
//                   <FormMessage className="shad-form-message" />
//                 </FormItem>
//               )}
//             />
//           )}

//           <Button
//             type="submit"
//             // name="submit"
//             className="bg-[#e87722] text-white w-full rounded-full my-4"
//             disabled={isLoading}
//             // onClick={() => console.log("sign up button clicked")}
//           >
//             {type === 'sign-in' ? 'Sign In' : 'Sign Up'}
//             {isLoading && (
//               <Image
//                 src="/loader.svg"
//                 alt="loader"
//                 width={24}
//                 height={24}
//                 className="ml-2 animate-spin"
//               />
//             )}
//           </Button>

//           {errorMessage && <p className="error-message"> *{errorMessage}</p>}
//           <div className="body-2 flex flex-col justify-center text-center">
//             <div className="flex justify-center">
//               <p>
//                 {type === 'sign-in'
//                   ? "Don't have an account?"
//                   : 'Already have an account?'}
//               </p>
//               <Link
//                 href={type === 'sign-in' ? '/sign-up' : '/sign-in'}
//                 className="ml-1 font-medium text-[#e87722]"
//               >
//                 {' '}
//                 {type === 'sign-in' ? 'Sign Up' : 'Sign In'}
//               </Link>
//             </div>
//             {type === 'sign-in' && (
//               <Link
//                 href="/forgot-password"
//                 className="ml-1 font-medium text-[#e87722]"
//               >
//                 {' '}
//                 Forgot Password?
//               </Link>
//             )}
//           </div>
//           {isSuccess && type === 'sign-up' && (
//             <div className="flex justify-center text-center mt-3 font-semibold">
//               <p>
//                 Success! Please check your email for a confirmation link from
//                 us.
//               </p>
//             </div>
//           )}
//         </form>
//       </Form>
//       {/* OTP Verification */}
//     </>
//   );
// };

// export default AuthForm;
