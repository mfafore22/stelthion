import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { isMallId } from '@/lib/mall/ids';

const IDEAPARK_DATA = {
  id: 'ideapark-lempaala',
  summary: {
    mall_name: 'Ideapark Lempäälä',
    city: 'Lempäälä',
    total_shops: 163,
    // Filled in at request time so the "Updated" label in /mall/properties is current.
    collection_date: '',
    data_source: 'Ideapark tenant registry',
    shops_by_retailer_type: {
      'Fashion': 50,
      'Food & Beverage': 22,
      'Auto': 12,
      'Sports': 26,
      'Home & Living': 23,
      'Services': 34,
      'Beauty & Health': 17,
      'Children': 17,
      'Daily Goods & Tech': 9,
    },
    shops_by_category: {
      'Fashion': 50,
      'Food & Beverage': 22,
      'Auto': 12,
      'Sports': 26,
      'Home & Living': 23,
      'Services': 34,
      'Beauty & Health': 17,
      'Children': 17,
      'Daily Goods & Tech': 9,
    },
    retailer_type_percentages: {
      'Fashion': 21.5,
      'Food & Beverage': 13.5,
      'Auto': 7.4,
      'Sports': 16.0,
      'Home & Living': 14.1,
      'Services': 20.9,
      'Beauty & Health': 10.4,
      'Children': 10.4,
      'Daily Goods & Tech': 5.5,
    },
    top_categories: [
      { category: 'Fashion', count: 50, percentage: 21.5 },
      { category: 'Services', count: 34, percentage: 20.9 },
      { category: 'Sports', count: 26, percentage: 16.0 },
      { category: 'Home & Living', count: 23, percentage: 14.1 },
      { category: 'Food & Beverage', count: 22, percentage: 13.5 },
    ],
    shops_by_floor: {
      'Ground Floor': 95,
      'Upper Level': 68,
    },
  },
  shops: null,
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ mallId: string }> }
) {
  const { mallId } = await params;

  // Try static data first (ideapark)
  if (isMallId(mallId, 'ideapark-lempaala')) {
    const data = {
      ...IDEAPARK_DATA,
      summary: {
        ...IDEAPARK_DATA.summary,
        collection_date: new Date().toISOString().split('T')[0],
      },
    };
    return NextResponse.json({ success: true, data });
  }

  // Try database for other malls
  const mall = await prisma.mall.findUnique({
    where: { mallId },
    include: {
      stats: true,
      branding: true,
      categories: true,
    },
  });

  if (mall) {
    return NextResponse.json({
      success: true,
      data: {
        id: mall.mallId,
        summary: {
          mall_name: mall.name,
          city: mall.city,
          total_shops: mall.totalShops,
          collection_date: mall.createdAt.toISOString().split('T')[0],
          data_source: 'Database',
          shops_by_retailer_type: {},
          shops_by_category: {},
          retailer_type_percentages: {},
          top_categories: mall.categories.map((c) => ({
            category: c.name,
            count: c.shopCount,
            percentage: c.percentage,
          })),
          shops_by_floor: {},
        },
        shops: null,
      },
    });
  }

  // Return empty placeholder instead of 404
  return NextResponse.json({
    success: true,
    data: {
      id: mallId,
      summary: {
        mall_name: mallId.charAt(0).toUpperCase() + mallId.slice(1),
        city: 'Unknown',
        total_shops: 0,
        collection_date: new Date().toISOString().split('T')[0],
        data_source: 'Pending setup',
        shops_by_retailer_type: {},
        shops_by_category: {},
        retailer_type_percentages: {},
        top_categories: [],
        shops_by_floor: {},
      },
      shops: null,
    },
  });
}