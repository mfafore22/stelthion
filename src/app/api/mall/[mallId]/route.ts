/**
 * GET /api/mall/[mallId]
 * Returns mall detail data for a specific mall.
 * Currently serves static Ideapark Lempäälä data.
 */

import { NextRequest, NextResponse } from 'next/server';

const IDEAPARK_DATA = {
  id: 'ideapark',
  summary: {
    mall_name: 'Ideapark Lempäälä',
    city: 'Lempäälä',
    total_shops: 170,
    collection_date: '2024-01-15',
    data_source: 'Ideapark tenant registry 2024',
    shops_by_retailer_type: {
      'Fashion and accessories': 48,
      'Food and beverage': 32,
      'Home and living': 22,
      'Health and beauty': 18,
      'Electronics': 12,
      'Sports and leisure': 16,
      'Services': 14,
      'Entertainment': 8,
    },
    shops_by_category: {
      'Clothing': 28,
      'Restaurants': 18,
      'Cafes': 10,
      'Footwear': 12,
      'Jewellery': 8,
      'Cosmetics': 10,
      'Sports': 9,
      'Electronics': 8,
      'Furniture': 7,
      'Other': 60,
    },
    retailer_type_percentages: {
      'Fashion and accessories': 28.2,
      'Food and beverage': 18.8,
      'Home and living': 12.9,
      'Health and beauty': 10.6,
      'Sports and leisure': 9.4,
      'Electronics': 7.1,
      'Services': 8.2,
      'Entertainment': 4.7,
    },
    top_categories: [
      { category: 'Fashion and accessories', count: 48, percentage: 28.2 },
      { category: 'Food and beverage', count: 32, percentage: 18.8 },
      { category: 'Home and living', count: 22, percentage: 12.9 },
      { category: 'Health and beauty', count: 18, percentage: 10.6 },
      { category: 'Sports and leisure', count: 16, percentage: 9.4 },
    ],
    shops_by_floor: {
      'Ground Floor': 95,
      'Upper Level': 75,
    },
  },
  shops: null, // detailed shop list not loaded in summary view
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ mallId: string }> }
) {
  const { mallId } = await params;

  if (mallId !== 'ideapark') {
    return NextResponse.json(
      { success: false, error: `Mall '${mallId}' not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: IDEAPARK_DATA });
}
