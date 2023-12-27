
import Head from 'next/head'
import { Analytics } from '@vercel/analytics/react';

const Layout = ({ children, title = 'PrivateGPT' }) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta charSet='utf-8' />
        <meta name='viewport' content='initial-scale=1.0, width=device-width' />
        <script type="text/javascript">
        window.AppcuesSettings = { enableURLDetection };
        </script>
        <script src="//fast.appcues.com/205682.js"></script>
      </Head>
      <main>{children}</main>
      <body><Analytics /></body>
      <footer>
        <p>&copy; {new Date().getFullYear()} PrivateGPT</p>
      </footer>
    </>
  )
}

export default Layout