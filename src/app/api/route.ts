import { NextResponse } from 'next/server'
import { resumeAndPrerenderToNodeStream } from 'react-dom/static'

export async function POST(request: Request) {
  try {
     const {name } = await request.json();
     return NextResponse.json({message: 'Hello'});

  }catch(error){
    const message = error instanceof Error ? error.message : "Unexpected error"
     
     return new Response(message ,{status: 500})
  }
}