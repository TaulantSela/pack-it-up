import { NextRequest, NextResponse } from 'next/server';

const user = false;

export function middleware(request: NextRequest) {
  console.log('middleware is running');
  if (!user) {
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: ['/admin', '/user'],
};
