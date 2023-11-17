
import Head from 'next/head'
import Navbar from './Navbar'

const Layout = ({ children, title = 'PrivateGPT' }) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta charSet='utf-8' />
        <meta name='viewport' content='initial-scale=1.0, width=device-width' />
      </Head>
      <Navbar />
      <main>{children}</main>
      <footer>
        <p>&copy; {new Date().getFullYear()} PrivateGPT</p>
      </footer>
    </>
  )
}

export default Layout