import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { collection, addDoc, getDocs, query, where, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export default function App() {
  const [seoeunUnsettledTotal, setSeoeunUnsettledTotal] = useState(0);
  const [seowooUnsettledTotal, setSeowooUnsettledTotal] = useState(0);
  const [yunjaeUnsettledTotal, setYunjaeUnsettledTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [seoeunUnsettledGameTime, setSeoeunUnsettledGameTime] = useState(0);
  const [seowooUnsettledGameTime, setSeowooUnsettledGameTime] = useState(0);
  const [yunjaeUnsettledGameTime, setYunjaeUnsettledGameTime] = useState(0);


  // 미션 데이터 상태 추가
  const [seoeunMissions, setSeoeunMissions] = useState([]);
  const [seowooMissions, setSeowooMissions] = useState([]);
  const [yunjaeMissions, setYunjaeMissions] = useState([]);

  // 미션 리스트 모달 상태 추가
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMissions, setCurrentMissions] = useState([]);
  const [currentPerson, setCurrentPerson] = useState('');

  // 미정산 총합 불러오기
  const fetchUnsettledTotals = async () => {
    try {
      // SEOEUN 미션 완료 데이터 가져오기
      const seoeunMissionsQuery = query(
        collection(db, 'missionCompletionsSeoeun')
      );
      const seoeunMissionsSnapshot = await getDocs(seoeunMissionsQuery);
      const seoeunMissionsData = seoeunMissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSeoeunMissions(seoeunMissionsData);

      // SEOWOO 미션 완료 데이터 가져오기
      const seowooMissionsQuery = query(
        collection(db, 'missionCompletionsSeowoo')
      );
      const seowooMissionsSnapshot = await getDocs(seowooMissionsQuery);
      const seowooMissionsData = seowooMissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSeowooMissions(seowooMissionsData);

      // YUNJAE 미션 완료 데이터 가져오기
      const yunjaeMissionsQuery = query(
        collection(db, 'missionCompletionsYUNJAE')
      );
      const yunjaeMissionsSnapshot = await getDocs(yunjaeMissionsQuery);
      const yunjaeMissionsData = yunjaeMissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setYunjaeMissions(yunjaeMissionsData);

      // SEOEUN 미션 보상 총합 계산
      const seoeunTotalEarned = seoeunMissionsData.reduce((sum, mission) => {
        return sum + (mission.rewardMoney || 0);
      }, 0);
      const seoeunTotalGameTime = seoeunMissionsData.reduce((sum, mission) => {
         return sum + (mission.rewardGameTime || 0);
      }, 0);
      // SEOWOO 미션 보상 총합 계산
      const seowooTotalEarned = seowooMissionsData.reduce((sum, mission) => {
        return sum + (mission.rewardMoney || 0);
      }, 0);
      const seowooTotalGameTime = seowooMissionsData.reduce((sum, mission) => {
        return sum + (mission.rewardGameTime || 0);
      }, 0);
      // YUNJAE 미션 보상 총합 계산
      const yunjaeTotalEarned = yunjaeMissionsData.reduce((sum, mission) => {
        return sum + (mission.rewardMoney || 0);
      }, 0);
      const yunjaeTotalGameTime = yunjaeMissionsData.reduce((sum, mission) => {
        return sum + (mission.rewardGameTime || 0);
      }, 0);
      setSeoeunUnsettledTotal(seoeunTotalEarned);
      setSeowooUnsettledTotal(seowooTotalEarned);
      setYunjaeUnsettledTotal(yunjaeTotalEarned);
      setSeoeunUnsettledGameTime(seoeunTotalGameTime);
      setSeowooUnsettledGameTime(seowooTotalGameTime);
      setYunjaeUnsettledGameTime(yunjaeTotalGameTime);

      console.log('SEOEUN 미정산 총합:', seoeunTotalEarned, '원,', seoeunTotalGameTime, '분');
      console.log('SEOWOO 미정산 총합:', seowooTotalEarned, '원,', seowooTotalGameTime, '분');
      console.log('YUNJAE 미정산 총합:', yunjaeTotalEarned, '원,', yunjaeTotalGameTime, '분');

    } catch (error) {
      console.error('정산 데이터 가져오기 실패:', error);
      Alert.alert('오류', '정산 데이터를 불러오는 데 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchUnsettledTotals();
  }, []);

  // 미션 리스트 보기 함수 (새로 추가)
  const showMissionsList = (person) => {
    let missions = [];
    let personName = '';

    if (person === 'SEOEUN') {
      missions = seoeunMissions;
      personName = 'SEOEUN';
    } else if (person === 'SEOWOO') {
      missions = seowooMissions;
      personName = 'SEOWOO';
    } else {
      missions = yunjaeMissions;
      personName = 'YUNJAE';
    }

    // 미션이 없을 경우
    if (missions.length === 0) {
      Alert.alert(
        '미션 없음',
        `${personName}의 미정산 미션이 없습니다.`,
        [{ text: '확인' }]
      );
      return;
    }

  // 완료 시간 기준으로 정렬 (최신순)
      const sortedMissions = [...missions].sort((a, b) => {
        const dateA = a.completedAt?.toDate?.() || new Date(a.completedAt || a.createdAt || 0);
        const dateB = b.completedAt?.toDate?.() || new Date(b.completedAt || b.createdAt || 0);
        return dateA - dateB; // 오름차순(오래된순)으로 정렬
      });
    setCurrentMissions(sortedMissions);
    setCurrentPerson(personName);
    setModalVisible(true);
  };

  // 정산 처리 함수
  const handleSettlement = useCallback(async (person: string) => {
    const unsettledAmount =
      person === 'SEOEUN' ? seoeunUnsettledTotal :
      person === 'SEOWOO' ? seowooUnsettledTotal :
      yunjaeUnsettledTotal;

    if (unsettledAmount <= 0) {
      Alert.alert(
        '정산 불가',
        '정산할 금액이 없습니다.',
        [{ text: '확인' }]
      );
      return;
    }

    Alert.alert(
      `${person} 정산`,
      `${person}에게 ${unsettledAmount}원을 정산하시겠습니까?`,
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '확인',
          onPress: async () => {
            try {
              setIsLoading(true);

              if (person === 'SEOEUN') {
                // SEOEUN 미션 데이터 가져오기
                const missionsQuery = query(collection(db, 'missionCompletionsSeoeun'));
                const missionsSnapshot = await getDocs(missionsQuery);

                // 각 미션 데이터를 settlementsSEOEUN으로 이동
                for (const missionDoc of missionsSnapshot.docs) {
                  const missionData = missionDoc.data();

                  // 새 컬렉션에 데이터 추가
                  await addDoc(collection(db, 'settlementsSEOEUN'), {
                    ...missionData,
                    settledAt: Timestamp.now()
                  });

                  // 기존 미션 데이터 삭제
                  await deleteDoc(doc(db, 'missionCompletionsSeoeun', missionDoc.id));
                }

                // 정산 기록 저장
                await addDoc(collection(db, 'settlementTotal'), {
                  userId: 'YUNJAE',
                  recipient: 'SEOEUN',
                  amount: unsettledAmount,
                  settledAt: Timestamp.now()
                });

                setSeoeunUnsettledTotal(0);
                setSeoeunUnsettledGameTime(0);
                setSeoeunMissions([]);
              } else if (person === 'SEOWOO') {
                // SEOWOO 미션 데이터 가져오기
                const missionsQuery = query(collection(db, 'missionCompletionsSeowoo'));
                const missionsSnapshot = await getDocs(missionsQuery);

                // 각 미션 데이터를 settlementsSEOWOO로 이동
                for (const missionDoc of missionsSnapshot.docs) {
                  const missionData = missionDoc.data();

                  // 새 컬렉션에 데이터 추가
                  await addDoc(collection(db, 'settlementsSEOWOO'), {
                    ...missionData,
                    settledAt: Timestamp.now()
                  });

                  // 기존 미션 데이터 삭제
                  await deleteDoc(doc(db, 'missionCompletionsSeowoo', missionDoc.id));
                }

                // 정산 기록 저장
                await addDoc(collection(db, 'settlementTotal'), {
                  userId: 'YUNJAE',
                  recipient: 'SEOWOO',
                  amount: unsettledAmount,
                  settledAt: Timestamp.now()
                });

                setSeowooUnsettledTotal(0);
                setSeowooUnsettledGameTime(0);
                setSeowooMissions([]);
              } else { // YUNJAE 정산
                // YUNJAE 미션 데이터 가져오기
                const missionsQuery = query(collection(db, 'missionCompletionsYUNJAE'));
                const missionsSnapshot = await getDocs(missionsQuery);

                // 각 미션 데이터를 settlementsYUNJAE로 이동
                for (const missionDoc of missionsSnapshot.docs) {
                  const missionData = missionDoc.data();

                  // 새 컬렉션에 데이터 추가
                  await addDoc(collection(db, 'settlementsYUNJAE'), {
                    ...missionData,
                    settledAt: Timestamp.now()
                  });

                  // 기존 미션 데이터 삭제
                  await deleteDoc(doc(db, 'missionCompletionsYUNJAE', missionDoc.id));
                }

                // 정산 기록 저장
                await addDoc(collection(db, 'settlementTotal'), {
                  userId: 'YUNJAE',
                  recipient: 'YUNJAE',
                  amount: unsettledAmount,
                  settledAt: Timestamp.now()
                });

                setYunjaeUnsettledTotal(0);
                setYunjaeUnsettledGameTime(0);
                setYunjaeMissions([]);
              }

              setIsLoading(false);

              // 다시 데이터 불러오기
              await fetchUnsettledTotals();

              Alert.alert(
                '정산 완료',
                `${person}에게 ${unsettledAmount}원이 정산되었습니다.`,
                [{ text: '확인' }]
              );
            } catch (error) {
              console.error('정산 처리 실패:', error);
              setIsLoading(false);
              Alert.alert(
                '오류',
                '정산 처리 중 문제가 발생했습니다. 다시 시도해주세요.',
                [{ text: '확인' }]
              );
            }
          }
        }
      ]
    );
  }, [seoeunUnsettledTotal, seowooUnsettledTotal, yunjaeUnsettledTotal, seoeunMissions, seowooMissions, yunjaeMissions]);

  // 날짜와 시간 포맷 함수 수정
  const formatDate = (timestamp) => {
    if (!timestamp) return '날짜 없음';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

      // 날짜 포맷 (YYYY-MM-DD)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      // 시간 포맷 (HH:MM)
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      return `${dateStr} ${timeStr}`;
    } catch (error) {
      return '날짜 형식 오류';
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>정산 관리</Text>
      </View>

      {/* 미정산 총합 카드 - 스크롤 가능하도록 수정 */}
      <ScrollView style={styles.cardsContainer} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* SEOEUN 카드 - 터치 가능하게 수정 */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => showMissionsList('SEOEUN')}
          disabled={seoeunUnsettledTotal <= 0}
        >
          <Text style={styles.cardLabel}>SEOEUN 미정산 총합</Text>
          <Text style={styles.cardValue}>{seoeunUnsettledTotal}원</Text>
          {seoeunUnsettledGameTime > 0 && (
              <Text style={styles.cardGameTime}>GameTime: {seoeunUnsettledGameTime}분</Text>
          )}
          {seoeunUnsettledTotal > 0 && (
            <Text style={styles.tapToView}>터치하여 미션 목록 보기</Text>
          )}
        </TouchableOpacity>

        {/* SEOWOO 카드 - 터치 가능하게 수정 */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => showMissionsList('SEOWOO')}
          disabled={seowooUnsettledTotal <= 0}
        >
          <Text style={styles.cardLabel}>SEOWOO 미정산 총합</Text>
          <Text style={styles.cardValue}>{seowooUnsettledTotal}원</Text>
          {seowooUnsettledGameTime > 0 && (
              <Text style={styles.cardGameTime}>GameTime: {seowooUnsettledGameTime}분</Text>
          )}
          {seowooUnsettledTotal > 0 && (
            <Text style={styles.tapToView}>터치하여 미션 목록 보기</Text>
          )}
        </TouchableOpacity>

        {/* YUNJAE 카드 - 터치 가능하게 수정 */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => showMissionsList('YUNJAE')}
          disabled={yunjaeUnsettledTotal <= 0}
        >
          <Text style={styles.cardLabel}>YUNJAE 미정산 총합</Text>
          <Text style={styles.cardValue}>{yunjaeUnsettledTotal}원</Text>
          {yunjaeUnsettledGameTime > 0 && (
              <Text style={styles.cardGameTime}>GameTime: {yunjaeUnsettledGameTime}분</Text>
          )}
          {yunjaeUnsettledTotal > 0 && (
            <Text style={styles.tapToView}>터치하여 미션 목록 보기</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* 정산 버튼 영역 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.settlementButton,
            (seoeunUnsettledTotal <= 0 || isLoading) && styles.disabledButton
          ]}
          onPress={() => handleSettlement('SEOEUN')}
          disabled={seoeunUnsettledTotal <= 0 || isLoading}
        >
          <Text style={styles.settlementButtonText}>
            {isLoading ? '처리 중...' : 'SEOEUN 정산'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.settlementButton,
            (seowooUnsettledTotal <= 0 || isLoading) && styles.disabledButton
          ]}
          onPress={() => handleSettlement('SEOWOO')}
          disabled={seowooUnsettledTotal <= 0 || isLoading}
        >
          <Text style={styles.settlementButtonText}>
            {isLoading ? '처리 중...' : 'SEOWOO 정산'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.settlementButton,
            (yunjaeUnsettledTotal <= 0 || isLoading) && styles.disabledButton
          ]}
          onPress={() => handleSettlement('YUNJAE')}
          disabled={yunjaeUnsettledTotal <= 0 || isLoading}
        >
          <Text style={styles.settlementButtonText}>
            {isLoading ? '처리 중...' : 'YUNJAE 정산'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 미션 리스트 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{currentPerson} 미정산 미션 목록</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>닫기</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.missionList}>
              {currentMissions.map((mission, index) => (
                <View key={mission.id || index} style={styles.missionItem}>
                  <View style={styles.missionHeader}>
                    <Text style={styles.missionTitle}>
                      {mission.missionTitle || mission.title || '미션명 없음'}
                    </Text>
                    <Text style={styles.missionReward}>
                      {mission.rewardMoney || 0}원
                    </Text>
                  </View>

                  <View style={styles.missionDetails}>
                    <Text style={styles.missionDate}>
                      완료일시: {formatDate(mission.completedAt || mission.createdAt)}
                    </Text>
                    {mission.rewardGameTime > 0 && (
                          <Text style={styles.missionGameTime}>
                            GameTime: {mission.rewardGameTime}분
                          </Text>
                     )}
                    {mission.missionDescription && (
                      <Text style={styles.missionDescription}>
                        {mission.missionDescription}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Text style={styles.totalMissions}>
                총 {currentMissions.length}개 미션
              </Text>
              <View style={styles.totalAmountContainer}>
                <Text style={styles.totalAmount}>
                  총액: {currentPerson === 'SEOEUN'
                    ? seoeunUnsettledTotal
                    : currentPerson === 'SEOWOO'
                      ? seowooUnsettledTotal
                      : yunjaeUnsettledTotal}원
                </Text>
                {(currentPerson === 'SEOEUN' && seoeunUnsettledGameTime > 0) ||
                 (currentPerson === 'SEOWOO' && seowooUnsettledGameTime > 0) ||
                 (currentPerson === 'YUNJAE' && yunjaeUnsettledGameTime > 0) ? (
                  <Text style={styles.totalGameTime}>
                    총 GameTime: {currentPerson === 'SEOEUN'
                      ? seoeunUnsettledGameTime
                      : currentPerson === 'SEOWOO'
                        ? seowooUnsettledGameTime
                        : yunjaeUnsettledGameTime}분
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  cardsContainer: {
    padding: 20,
    marginTop: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  cardLabel: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  tapToView: {
    fontSize: 12,
    color: '#757575',
    marginTop: 10,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  settlementButton: {
    flex: 1,
    backgroundColor: '#FF9800',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 3,
  },
  settlementButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  // 모달 스타일
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    height: '80%',
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#FF5722',
    fontWeight: 'bold',
  },
  missionList: {
    flex: 1,
  },
  missionItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 3,
  },
  missionReward: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    flex: 1,
    textAlign: 'right',
  },
  missionDetails: {
    flexDirection: 'column',
  },
  missionDate: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 5,
  },
  missionDescription: {
    fontSize: 14,
    color: '#424242',
    marginTop: 5,
  },
  modalFooter: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalMissions: {
    fontSize: 14,
    color: '#757575',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  cardGameTime: {
    fontSize: 16,
    color: '#4CAF50',
    marginTop: 5,
  },
  missionGameTime: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 5,
  },
  totalAmountContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  totalGameTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 4,
  },

});