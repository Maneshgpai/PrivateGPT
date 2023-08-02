import FileUpload from "./components/FileUpload"
import Navbar from "./components/Navbar"
import MyDropzone from "./components/MyDropone"
export default function Home() {
  return (
    <div>
      <Navbar/>
      <MyDropzone className=" p-16 mt-10 border border-neutral-200 w-2/3 mx-auto"/>
    </div>
  )
}
