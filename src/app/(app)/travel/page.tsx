"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import type { Trip } from "@/types";

export default function TravelListPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showJoin, setShowJoin] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetch("/api/trips").then((r) => r.json()).then(setTrips);
  }, []);

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setJoining(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", invite_code: inviteCode.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        router.push(`/travel/${data.tripId}`);
      } else {
        alert(data.error || "참여에 실패했습니다.");
      }
    } catch {
      alert("참여에 실패했습니다.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-toss-surface">
      <TopBar title="✈️ 여행가계부" />

      <div className="px-5 pt-4 pb-32 space-y-4">
        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/travel/add")}
            className="flex-1 py-3 bg-toss-blue text-white rounded-2xl font-semibold text-sm"
          >
            새 여행 만들기
          </button>
          <button
            onClick={() => setShowJoin(true)}
            className="flex-1 py-3 bg-white text-toss-text rounded-2xl font-semibold text-sm border border-toss-border"
          >
            초대 코드로 참여
          </button>
        </div>

        {/* 초대 코드 입력 모달 */}
        {showJoin && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowJoin(false)}>
            <div className="bg-white rounded-2xl p-6 mx-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-toss-text mb-4">초대 코드 입력</h2>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="초대 코드를 입력하세요"
                className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue transition-colors mb-4"
                maxLength={8}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowJoin(false)}
                  className="flex-1 py-3 rounded-xl bg-toss-surface text-toss-text-sub font-semibold text-sm"
                >
                  취소
                </button>
                <button
                  onClick={handleJoin}
                  disabled={joining || !inviteCode.trim()}
                  className="flex-1 py-3 rounded-xl bg-toss-blue text-white font-semibold text-sm disabled:opacity-50"
                >
                  {joining ? "참여 중..." : "참여하기"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 여행 목록 */}
        {trips.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">✈️</p>
            <p className="text-toss-text-sub text-sm">아직 여행이 없습니다</p>
            <p className="text-toss-text-ter text-xs mt-1">새 여행을 만들어보세요!</p>
          </div>
        ) : (
          trips.map((trip) => {
            const days = Math.ceil(
              (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)
            ) + 1;
            return (
              <button
                key={trip.id}
                onClick={() => router.push(`/travel/${trip.id}`)}
                className="w-full bg-white rounded-2xl p-5 text-left shadow-sm border border-toss-border/50 hover:border-toss-blue/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-toss-text">{trip.name}</h3>
                    <p className="text-sm text-toss-text-sub mt-1">📍 {trip.destination}</p>
                  </div>
                  <span className="text-2xl">✈️</span>
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-toss-text-ter">
                  <span>{trip.start_date} ~ {trip.end_date}</span>
                  <span className="text-toss-blue font-medium">{days}일</span>
                </div>
                {trip.description && (
                  <p className="text-xs text-toss-text-ter mt-2 line-clamp-2">{trip.description}</p>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}