
import Head from 'next/head'
import { Analytics } from '@vercel/analytics/react';

const Layout = ({ children, title = 'PrivateGPT' }) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta charSet='utf-8' />
        <meta name='viewport' content='initial-scale=1.0, width=device-width' />
      </Head>
      <main>{children}</main>
      <body><Analytics /></body>
      <footer>
        <p>&copy; {new Date().getFullYear()} PrivateGPT</p>
      </footer>
    </>
  )
}
