import { NextRequest, NextResponse } from "next/server";

// Naver Land URL에서 단지 번호 추출
// 예: https://new.land.naver.com/complexes/100120?... → "100120"
function extractComplexNo(url: string): string | null {
  const m = url.match(/\/complexes\/(\d+)/);
  return m ? m[1] : null;
}

// "10억 5,000" → 1,050,000,000 원
function parseNaverPrice(priceStr: string): number {
  if (!priceStr || priceStr.trim() === "") return Infinity;
  let total = 0;
  const eok = priceStr.match(/(\d+(?:\.\d+)?)억/);
  if (eok) total += parseFloat(eok[1]) * 100_000_000;
  // 억 뒤에 나오는 만원 (e.g. "10억 5,000")
  const afterEok = priceStr.match(/억\s*([\d,]+)/);
  if (afterEok) total += parseInt(afterEok[1].replace(/,/g, "")) * 10_000;
  // 억 없이 만원 단위만 (e.g. "3,500")
  if (!eok) {
    const onlyMan = priceStr.replace(/,/g, "");
    const n = parseInt(onlyMan);
    if (!isNaN(n)) total = n * 10_000;
  }
  return total || Infinity;
}

interface NaverArticle {
  floorInfo?: string;
  area1?: number;    // 전용면적 ㎡
  area2?: number;    // 공급면적 ㎡
  dealOrWarrantPrc?: string;
  tradeTypeName?: string;
  direction?: string;
  articleName?: string;
  articleNo?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      url,
      trade_type = "A1",     // A1=매매 B1=전세 B2=월세
      floor_min,
      floor_max,
      min_area,
      max_area,
    } = body as {
      url: string;
      trade_type?: string;
      floor_min?: number | null;
      floor_max?: number | null;
      min_area?: number | null;
      max_area?: number | null;
    };

    const complexNo = extractComplexNo(url);
    if (!complexNo) {
      return NextResponse.json(
        { error: "URL에서 단지 번호를 찾을 수 없어요. 네이버 부동산 단지 페이지 URL을 입력해주세요." },
        { status: 400 }
      );
    }

    const fetchHeaders: HeadersInit = {
      "Accept": "*/*",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      "Referer": "https://new.land.naver.com/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    // 여러 페이지를 가격순으로 가져오기 (최대 5페이지 = 100개)
    const allArticles: NaverArticle[] = [];
    let totalCount = 0;
    let complexName = "";

    for (let page = 1; page <= 5; page++) {
      const apiUrl =
        `https://new.land.naver.com/api/articles` +
        `?complexNo=${complexNo}` +
        `&tradeType=${trade_type}` +
        `&realEstateType=APT:PRE` +
        `&page=${page}` +
        `&pageSize=20` +
        `&order=prc`;

      const res = await fetch(apiUrl, { headers: fetchHeaders, next: { revalidate: 0 } });

      if (!res.ok) {
        // 첫 페이지부터 실패하면 에러 반환
        if (page === 1) {
          return NextResponse.json(
            { error: `네이버 부동산 API 요청 실패 (${res.status}). 잠시 후 다시 시도해주세요.` },
            { status: 502 }
          );
        }
        break;
      }

      const data = await res.json();
      const articles: NaverArticle[] = data.body ?? data.articleList ?? [];

      if (page === 1) {
        totalCount = data.totalCount ?? 0;
        complexName = data.complexName ?? "";
      }

      if (articles.length === 0) break;
      allArticles.push(...articles);
      if (articles.length < 20) break;
    }

    // 필터 적용
    let filtered = allArticles;

    if (min_area != null || max_area != null) {
      filtered = filtered.filter((a) => {
        const area = a.area1 ?? 0;
        if (min_area != null && area < min_area) return false;
        if (max_area != null && area > max_area) return false;
        return true;
      });
    }

    if (floor_min != null || floor_max != null) {
      filtered = filtered.filter((a) => {
        const floorStr = a.floorInfo ?? "";
        const floor = parseInt(floorStr.split("/")[0]);
        if (isNaN(floor)) return true; // 파싱 안 되면 포함
        if (floor_min != null && floor < floor_min) return false;
        if (floor_max != null && floor > floor_max) return false;
        return true;
      });
    }

    if (filtered.length === 0) {
      return NextResponse.json({
        complexNo,
        complexName,
        totalFetched: allArticles.length,
        totalCount,
        matchCount: 0,
        minPrice: null,
        listings: [],
      });
    }

    // 가격 파싱 후 최저가 산출
    const withPrice = filtered.map((a) => ({
      ...a,
      _price: parseNaverPrice(a.dealOrWarrantPrc ?? ""),
    }));

    withPrice.sort((a, b) => a._price - b._price);

    const minPrice = withPrice[0]._price === Infinity ? null : withPrice[0]._price;

    // 상위 5개 매물 반환
    const listings = withPrice.slice(0, 5).map((a) => ({
      floor: a.floorInfo ?? "-",
      area: a.area1 ?? 0,
      price: a.dealOrWarrantPrc ?? "-",
      direction: a.direction ?? "",
    }));

    return NextResponse.json({
      complexNo,
      complexName,
      totalFetched: allArticles.length,
      totalCount,
      matchCount: filtered.length,
      minPrice,
      listings,
    });
  } catch (e) {
    console.error("naver-land proxy error:", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
