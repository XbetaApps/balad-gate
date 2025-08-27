import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Search for tags that match the search term
    const tags = await prisma.tags.findMany({
      where: {
        name: {
          contains: search,
          mode: 'insensitive', // Case-insensitive search
        },
      },
      take: Math.min(limit, 50), // Limit the number of results (max 50)
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        // Add other fields you want to return
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error searching tags:', error);
    return NextResponse.json(
      { error: 'An error occurred while searching for tags' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    const newTag = await prisma.tags.create({
      data: {
        name,
      },
    });

    return NextResponse.json(newTag, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);
    
    // Handle duplicate tag error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Tag already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'An error occurred while creating the tag' },
      { status: 500 }
    );
  }
}
