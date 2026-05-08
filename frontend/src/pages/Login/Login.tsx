import { LoginForm } from '@/components/form/login-form'

const Login = () => {
  return (
    <section className='bg-muted dark:bg-background flex min-h-svh flex-col items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-md'>
        <LoginForm />
      </div>
    </section>
  )
}

export default Login
