import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ArrowUpTrayIcon, XMarkIcon, DocumentIcon} from '@heroicons/react/24/solid'
import Loading from "./Loading";

const Dropzone = ({ className }) => {
  const [files, setFiles] = useState([])
  const [rejected, setRejected] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async e => {
    e.preventDefault()

    if (!files?.length) return

    setIsLoading(true)
    const formData = new FormData();
    files.forEach(file => formData.append('file', file))
    formData.append('filename_as_doc_id', 'true');

    try{
    const response = await fetch('http://localhost:8080/api/uploadFile', {
    mode: 'cors',
    method: 'POST',
    body: formData,
    });

    const responseText = await response.text();
    console.log(JSON.parse(responseText))
    if(response.status === 200){
        setIsLoading(false)
        window.location.href = '/chat'

    }
    else {
      setIsLoading(false)
      const data = JSON.parse(responseText)
      setError(data.message)
    }
    }

    catch{
    setIsLoading(false)
    setError("Something went wrong")
    }
  }

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (acceptedFiles?.length) {
      setFiles(previousFiles => [
        ...previousFiles,
        ...acceptedFiles.map(file =>
          Object.assign(file, { preview: URL.createObjectURL(file) })
        )
      ])
    }

    if (rejectedFiles?.length) {
      setRejected(previousFiles => [...previousFiles, ...rejectedFiles])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ accept: {
    'pdf': ['.pdf']
  }, onDrop})

  useEffect(() => {
    // Revoke the data uris to avoid memory leaks
    return () => files.forEach(file => URL.revokeObjectURL(file.preview))
  }, [files])

  const removeFile = name => {
    setFiles(files => files.filter(file => file.name !== name))
  }

  const removeAll = () => {
    setFiles([])
    setRejected([])
  }

  const removeRejected = name => {
    setRejected(files => files.filter(({ file }) => file.name !== name))
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        {...getRootProps({
          className: className
        })}
        >
        <input {...getInputProps()} />
        { !isLoading &&
        <div className='flex flex-col items-center justify-center gap-4'>
          <ArrowUpTrayIcon className='w-5 h-5 fill-current' />
          {isDragActive ? (
              <p>Drop the files here ...</p>
          ) : (
            <div>
            <p>Drag & drop files here, or click to select files</p>
            <input type="file"/>
            </div>
          )}
        </div>
        }
        {
            isLoading && <Loading/>
        }
      </div>

        <p>{error}</p>

      {/* Preview */}
      <section className='mt-10'>
        <div className='flex gap-4'>
          <h2 className='title text-3xl font-semibold'>Preview</h2>
          <button
            type='button'
            onClick={removeAll}
            className='mt-1 text-[12px] uppercase tracking-wider font-bold text-neutral-500 border border-red-600 rounded-md px-3 hover:bg-red-600 hover:text-white transition-colors'
          >
            Remove all files
          </button>
          <button
            type='submit'
            className='ml-auto mt-1 text-lg text-white uppercase tracking-wider font-bold border bg-blue-600 hover:border-blue-950 rounded-md px-3 transition-colors'
          >
            Upload files
          </button>
        </div>

        {/* Accepted files */}
        <h3 className='title text-lg font-semibold text-neutral-600 mt-10 border-b pb-3'>
          Accepted Files
        </h3>
        <ul className=' flex gap-x-4 gap-y-8 flex-wrap mt-4'>
          {files.map(file => (
            <li key={file.name}>
              <div className=' flex items-end'>
                <DocumentIcon width={30} height={30}/>
                <p className=''>
                  {file.name}
                </p>
                <button
                  type='button'
                  className='w-7 h-7 border border-secondary-400 bg-secondary-400 rounded-full flex justify-center items-center hover:bg-white transition-colors ml-2'
                  onClick={() => removeFile(file.name)}
                >
                  <XMarkIcon className='w-5 h-5 fill-red-700 hover:fill-secondary-400 transition-colors' />
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Rejected Files */}
        <h3 className='title text-lg font-semibold text-neutral-600 mt-24 border-b pb-3'>
          Rejected Files
        </h3>
        <ul className='mt-6 flex flex-col'>
          {rejected.map(({ file, errors }) => (
            <li key={file.name} className='flex items-start justify-between'>
              <div>
                <p className='mt-2 text-neutral-500 text-sm font-medium'>
                  {file.name}
                </p>
                <ul className='text-[12px] text-red-400'>
                  {errors.map(error => (
                    <li key={error.code}>{error.message}</li>
                  ))}
                </ul>
              </div>
              <button
                type='button'
                className='mt-1 py-1 text-[12px] uppercase tracking-wider font-bold text-neutral-500 border border-secondary-400 rounded-md px-3 hover:bg-secondary-400 hover:text-white transition-colors'
                onClick={() => removeRejected(file.name)}
              >
                remove
              </button>
            </li>
          ))}
        </ul>
      </section>
    </form>
  )
}

export default Dropzone