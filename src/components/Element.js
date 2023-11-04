import React from 'react'

export default function Element({ data, color='bg-cyan-300' }) {
  return (
    <div className={`h-16 w-16 m-0 rounded-lg ${color}`}>
      {data}
    </div>
  )
}
