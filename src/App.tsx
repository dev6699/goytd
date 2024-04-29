import { useState } from 'react'
import './App.css'

type Info = {
  Author: string
  Description: string
  Duration: number
  Formats: Format[]
  Thumbnails: { URL: string }[]
  Title: string
  Views: number
}

type Format = {
  itag: number;
  url: string;
  mimeType: string;
  quality: string;
  signatureCipher: string;
  bitrate: number;
  fps: number;
  width: number;
  height: number;
  lastModified: string;
  contentLength: number;
  qualityLabel: string;
  projectionType: string;
  averageBitrate: number;
  audioQuality: string;
  approxDurationMs: string;
  audioSampleRate: string;
  audioChannels: number;
  initRange: {
    start: string;
    end: string;
  };
  indexRange: {
    start: string;
    end: string;
  };
  AudioTrack: any;
};

function App() {

  const [err, setErr] = useState('');
  const [url, setUrl] = useState('');
  const [src, setSrc] = useState('');
  const [info, setInfo] = useState<Info | null>(null);

  const formatDuration = (milliseconds: string): string => {
    const totalSeconds = +milliseconds / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatBytesToMB = (format: Format): string => {
    let bytes = format.contentLength
    if (bytes == 0) {
      bytes = (format.bitrate * +format.approxDurationMs / 1000) / 8
    }

    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2);
  };

  const handleSubmit = async () => {
    try {
      setErr('')
      setInfo(null)
      setSrc('')
      // @ts-ignore
      const response: Response = await Download(url)
      const res = await response.json() as Info
      res.Formats = res.Formats.filter(r => r.audioQuality)
      setInfo(res)
    } catch (err) {
      setErr((err as Error).message)
    }
  }

  return (
    <div className='container'>
      <a href='https://github.com/dev6699/goytd' target='_blank'>
        <svg height="32" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="32" data-view-component="true">
          <path fill='#fff' d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
        </svg>
      </a>
      <h1>GOYTD - YouTube Video Downloader</h1>

      <div className="form">
        <input
          type="text"
          value={url}
          onFocus={(e) => {
            e.target.select()
          }}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube link here"
          className="input-field"
        />
        <button onClick={handleSubmit} className="submit-btn">Download</button>
      </div>

      {err && <div className='error'>{err}</div>}

      {
        info &&
        <>
          <div>
            <div>Title: {info.Title}</div>
            <div>Duration: {formatDuration(info.Formats[0].approxDurationMs)}</div>
            <div>Views: {info.Views.toLocaleString()}</div>

            <div className='preview-container'>
              {src ?
                <video controls width={'100%'} height={240} key={src} autoPlay>
                  <source src={src} />
                </video>
                :
                <img
                  height={240}
                  src={info.Thumbnails[info.Thumbnails.length - 1].URL}
                />
              }
            </div>
          </div>

          <div className="table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Quality Label</th>
                  <th>MIME Type</th>
                  <th>Size</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {info?.Formats.map((format, index) => (
                  <tr key={index}>
                    <td>{format.qualityLabel}</td>
                    <td>{format.mimeType}</td>
                    <td>{formatBytesToMB(format)}MB</td>
                    <td>
                      <button onClick={() => {
                        setSrc(format.url)
                      }}
                        className="fetch-btn">
                        Preview
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      }
    </div>
  )
}

export default App
