import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Modal,
  Switch
} from 'react-native';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  deleteDoc,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from './firebase';
import { launchImageLibrary } from 'react-native-image-picker';
import { Image } from 'react-native';

interface User {
  id: string;
  name: string;
  level: number;
  exp: number;
  items: any[];
  profileImage?: string;
}

interface Character {
  name: string;  // 추가
  level: number;
  exp: number;
 // happiness: number;
  items: any[];
}


interface Mission {
  id: number;
  title: string;
  description: string;
  reward: {
    money: number;
    exp: number;
    gameTime: number; // New field
  };
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  estimatedTime: string;
  parentApprovalRequired: boolean;
}

interface MissionCompletionData {
  userId: string;
  missionId: number;
  title: string;
  completedAt: Timestamp;
  rewardMoney: number;
  rewardExp: number;
  rewardGameTime: number; // New field
}

// 레벨 보상 인터페이스 추가
interface LevelReward {
  id?: string;  // Firestore 문서 ID
  level: number;
  title: string;
  description?: string;
  isReceived: boolean;
  createdAt?: Timestamp;
  receivedAt?: Timestamp;
}

export default function App() {
  const [character, setCharacter] = useState<User>({
    id: 'YUNJAE',
    name: "ㅋㅋㅋ",
    level: 1,
    exp: 0,
    gameTime: 0,
    items: []
  });

  const [showReward, setShowReward] = useState(false);
  const [selectedMissions, setSelectedMissions] = useState<{[key: string]: boolean}>({});
  const [selectedPoints, setSelectedPoints] = useState(0);
  const [todayTotalPoints, setTodayTotalPoints] = useState(0);
  const [activeTab, setActiveTab] = useState('missions');
  const [levelUpAnimation] = useState(new Animated.Value(0));
  const [selectedGameTime, setSelectedGameTime] = useState(0);
  const [todayTotalGameTime, setTodayTotalGameTime] = useState(0);
  // 레벨 보상 관련 상태 추가
  const [rewardModalVisible, setRewardModalVisible] = useState(false);
  const [levelRewards, setLevelRewards] = useState<LevelReward[]>([]);
  const [editingReward, setEditingReward] = useState<LevelReward | null>(null);
  const [isAddingReward, setIsAddingReward] = useState(false);
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardLevel, setNewRewardLevel] = useState('');
  const [newRewardDescription, setNewRewardDescription] = useState('');

  const missions: Mission[] = [
    // 기존 미션 배열 유지
    {
      id: 10000,
      title: "책상 정리하기",
      description: "책상 위의 물건을 정리하여, 작업에 집중할 수 있게 만든다.",
      reward: {
        money: 100,
        exp: 12,
        gameTime : 0
      },
      difficulty: "EASY",
      estimatedTime: "5분",
      parentApprovalRequired: false
    },

    {
      id: 10001,
      title: "외출하고 돌아와서 바로 깨끗이 씻기",
      description: "외출하고 돌아와서 바로 샤워한다.",
      reward: {
        money: 300,
        exp: 5,
        gameTime : 0
      },
      difficulty: "NORMAL",
      estimatedTime: "15분",
      parentApprovalRequired: false
    },
    {
      id: 10002,
      title: "샤워하고 벗은 옷을 빨래로 넣기",
      description: "샤워하고 벗은 옷을 빨래 통에 넣는다.",
      reward: {
        money: 300,
        exp: 5,
        gameTime : 0
      },
      difficulty: "EASY",
      estimatedTime: "5분",
      parentApprovalRequired: false
    },
    {
      id: 10003,
      title: "식사도우미",
      description: "식사시 수저를 놓거나, 식기를 싱크대에 담궈 놓는다.",
      reward: {
        money: 100,
        exp: 1,
        gameTime : 0
      },
      difficulty: "EASY",
      estimatedTime: "5분",
      parentApprovalRequired: false
    },
    {
      id: 10004,
      title: "외출 후 옷 정리하기",
      description: "외출하고 돌아와서 입은 옷 정리하기",
      reward: {
        money: 100,
        exp: 1,
        gameTime : 0
      },
      difficulty: "EASY",
      estimatedTime: "2분",
      parentApprovalRequired: false
    },
    {
      id: 10005,
      title: "마신 컵 싱크대 넣기",
      description: "마신 컵 싱크대 넣는다.",
      reward: {
        money: 100,
        exp: 1,
        gameTime : 0
      },
      difficulty: "EASY",
      estimatedTime: "1분",
      parentApprovalRequired: false
    },
    {
      id: 10006,
      title: "혼자 밥먹기",
      description: "밥을 스스로 먹는다.",
      reward: {
        money: 300,
        exp: 1,
        gameTime: 5
      },
      difficulty: "NORMAL",
      estimatedTime: "20분",
      parentApprovalRequired: false
    }
  ];

  useEffect(() => {
    const fetchTodayMissions = async (userId: string,
        setTodayTotalPoints: (points: number) => void,
        setTodayTotalGameTime: (gameTime: number) => void) => {
      try {
        console.log('오늘의 미션 데이터 가져오기 시작');
        const todayMissions = await getTodayCompletedMissions('YUNJAE');
        console.log('오늘의 미션:', todayMissions);

        // 오늘의 총 금액 계산
        const todayTotal = todayMissions.reduce((sum, mission) => {
          return sum + (mission.rewardMoney || 0);
        }, 0);

      // 오늘의 총 GameTime 계산
      const todayTotalGameTime = todayMissions.reduce((sum, mission) => {
        return sum + (mission.rewardGameTime || 0);
      }, 0);

        console.log('오늘의 총 금액:', todayTotal);
        setTodayTotalPoints(todayTotal);
        console.log('오늘의 총 GameTime:', todayTotalGameTime);
        setTodayTotalGameTime(todayTotalGameTime);

      } catch (error) {
        console.error('오늘의 미션 데이터 가져오기 실패:', error);
      }
    };

    fetchTodayMissions('YUNJAE', setTodayTotalPoints, setTodayTotalGameTime);
  }, []);

  useEffect(() => {
    console.log('selectedMissions 변경됨:', selectedMissions);
    const totalPoints = missions
      .filter(mission => selectedMissions[mission.id])
      .reduce((sum, mission) => sum + mission.reward.money, 0);

  const totalGameTime = missions
    .filter(mission => selectedMissions[mission.id])
    .reduce((sum, mission) => sum + mission.reward.gameTime, 0);

    console.log('계산된 미션 총합:', totalPoints);
    setSelectedPoints(totalPoints);
    setSelectedGameTime(totalGameTime);
  }, [selectedMissions, missions]);

  // 컴포넌트 마운트 시 레벨 보상 목록 가져오기
  useEffect(() => {
    fetchLevelRewards();
  }, []);

  // 레벨 보상 목록 가져오기 함수
  const fetchLevelRewards = async () => {
    try {
      const rewardsQuery = query(
        collection(db, 'levelRewardsYUNJAE'),
        where('userId', '==', 'YUNJAE')
      );

      const rewardsSnapshot = await getDocs(rewardsQuery);
      const rewards = rewardsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LevelReward[];

      // 레벨 순으로 정렬
      rewards.sort((a, b) => a.level - b.level);

      setLevelRewards(rewards);
    } catch (error) {
      console.error('레벨 보상 목록 가져오기 실패:', error);
      Alert.alert('오류', '레벨 보상 목록을 불러오는데 실패했습니다.');
    }
  };

  // 레벨 보상 추가 함수
  const addLevelReward = async () => {
    if (!newRewardTitle.trim() || !newRewardLevel.trim()) {
      Alert.alert('입력 오류', '보상 이름과 레벨을 입력해주세요.');
      return;
    }

    const level = parseInt(newRewardLevel);
    if (isNaN(level) || level <= 0) {
      Alert.alert('입력 오류', '유효한 레벨 숫자를 입력해주세요.');
      return;
    }

    try {
      const newReward: LevelReward = {
        level,
        title: newRewardTitle,
        description: newRewardDescription,
        isReceived: false,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'levelRewardsYUNJAE'), {
        ...newReward,
        userId: 'YUNJAE'
      });

      setNewRewardTitle('');
      setNewRewardLevel('');
      setNewRewardDescription('');
      setIsAddingReward(false);

      // 목록 다시 불러오기
      await fetchLevelRewards();

      Alert.alert('성공', '레벨 보상이 추가되었습니다.');
    } catch (error) {
      console.error('레벨 보상 추가 실패:', error);
      Alert.alert('오류', '레벨 보상 추가에 실패했습니다.');
    }
  };

  // 레벨 보상 삭제 함수
  const deleteLevelReward = async (rewardId: string) => {
    try {
      await deleteDoc(doc(db, 'levelRewardsYUNJAE', rewardId));

      // 목록 다시 불러오기
      await fetchLevelRewards();

      Alert.alert('성공', '레벨 보상이 삭제되었습니다.');
    } catch (error) {
      console.error('레벨 보상 삭제 실패:', error);
      Alert.alert('오류', '레벨 보상 삭제에 실패했습니다.');
    }
  };

  // 레벨 보상 상태 토글 함수
  const toggleRewardReceived = async (reward: LevelReward) => {
    if (!reward.id) return;

    try {
      const rewardRef = doc(db, 'levelRewardsYUNJAE', reward.id);

      // 현재 캐릭터 레벨이 보상 레벨보다 낮으면 수령 불가
      if (!reward.isReceived && character.level < reward.level) {
        Alert.alert('수령 불가', `레벨 ${reward.level}에 도달해야 수령할 수 있습니다.`);
        return;
      }

      const updatedReward = {
        ...reward,
        isReceived: !reward.isReceived,
        receivedAt: !reward.isReceived ? Timestamp.now() : null
      };

      await updateDoc(rewardRef, updatedReward);

      // 목록 다시 불러오기
      await fetchLevelRewards();
    } catch (error) {
      console.error('레벨 보상 상태 변경 실패:', error);
      Alert.alert('오류', '레벨 보상 상태 변경에 실패했습니다.');
    }
  };

  // 레벨 보상 편집 모드 시작
  const startEditingReward = (reward: LevelReward) => {
    setEditingReward(reward);
    setNewRewardTitle(reward.title);
    setNewRewardLevel(reward.level.toString());
    setNewRewardDescription(reward.description || '');
  };

  // 레벨 보상 편집 저장
  const saveEditingReward = async () => {
    if (!editingReward || !editingReward.id) return;

    if (!newRewardTitle.trim() || !newRewardLevel.trim()) {
      Alert.alert('입력 오류', '보상 이름과 레벨을 입력해주세요.');
      return;
    }

    const level = parseInt(newRewardLevel);
    if (isNaN(level) || level <= 0) {
      Alert.alert('입력 오류', '유효한 레벨 숫자를 입력해주세요.');
      return;
    }

    try {
      const rewardRef = doc(db, 'levelRewardsYUNJAE', editingReward.id);

      const updatedReward = {
        ...editingReward,
        level,
        title: newRewardTitle,
        description: newRewardDescription
      };

      await updateDoc(rewardRef, updatedReward);

      setEditingReward(null);

      // 목록 다시 불러오기
      await fetchLevelRewards();

      Alert.alert('성공', '레벨 보상이 수정되었습니다.');
    } catch (error) {
      console.error('레벨 보상 수정 실패:', error);
      Alert.alert('오류', '레벨 보상 수정에 실패했습니다.');
    }
  };

  // 미션 선택 함수 (기존 코드 유지)
  const handleMissionSelect = useCallback((mission: Mission) => {
    setSelectedMissions(prev => {
      console.log('미션 선택:', mission.id);
      const newState = { ...prev, [mission.id]: !prev[mission.id] };
      console.log('새로운 선택 상태:', newState);
      return newState;
    });
  }, []);

  // 레벨 보상 목록 보기 함수
  const showLevelRewards = useCallback(() => {
    setRewardModalVisible(true);
  }, []);

      // Firebase에 데이터 저장
 const completeMissions = useCallback(async () => {
   console.log('completeMissions 시작');
   if (selectedPoints === 0) {
     Alert.alert('알림', '선택한 미션이 없습니다. 미션을 선택해주세요.');
     return;
   }

   // 선택된 미션들의 제목을 추출합니다
   const selectedMissionTitles = missions
     .filter(mission => selectedMissions[mission.id.toString()])
     .map(mission => `- ${mission.title} (${mission.reward.money}원)`)
     .join('\n');


   // 확인 팝업을 표시합니다
   Alert.alert(
     '미션 시작 확인',
     `다음 미션을 시작하시겠습니까?\n\n${selectedMissionTitles}\n\n총 보상: ${selectedPoints}원${selectedGameTime > 0 ? `, ${selectedGameTime}분` : ''}`,
     [
       {
         text: '취소',
         style: 'cancel'
       },
       {
         text: '시작하기',
         onPress: async () => {
           try {
             // 선택된 미션들의 데이터 수집
             console.log('선택된 미션들:', selectedMissions);  // 디버깅 로그 추가

             const completedMissions: MissionCompletionData[] = missions
               .filter(mission => selectedMissions[mission.id.toString()])
               .map(mission => ({
                 userId: 'YUNJAE', // 실제 사용자 ID로 대체 필요
                 missionId: mission.id,
                 title: mission.title,
                 completedAt: Timestamp.now(),
                 rewardMoney: mission.reward.money,
                 rewardExp: mission.reward.exp,
                 rewardGameTime: mission.reward.gameTime || 0  // 이 부분을 추가
               }));
             console.log('완료된 미션들:', completedMissions);  // 디버깅 로그 추가

             // Firebase에 데이터 저장
             await saveMissionCompletion(completedMissions);
             console.log('saveMissionCompletion');  // 디버깅 로그 추가

             // 경험치 계산 및 레벨업 처리
             let totalExp = completedMissions.reduce((sum, mission) => sum + mission.rewardExp, 0);

             setCharacter(prev => {
               let newExp = prev.exp + totalExp;
               let newLevel = prev.level;
               let didLevelUp = false;

               while (newExp >= 100) {
                 newLevel += 1;
                 newExp -= 100;
                 didLevelUp = true;
               }

               const updateData = {
                 name: prev.name,
                 level: newLevel,
                 exp: newExp,
                 profileImage: prev.profileImage,  // 프로필 이미지 정보 추가
                 items: prev.items
               };

               updateUserData('YUNJAE', updateData).catch(error => {
                 console.error('레벨업 데이터 저장 실패:', error);
               });

               if (didLevelUp) {
                 Alert.alert(
                   "🎉 레벨 업!",
                   `축하합니다! 레벨 ${newLevel}이 되었습니다!`,
                   [{ text: "확인", onPress: showLevelUpAnimation }]
                 );
               }

               return {
                 ...prev,
                 level: newLevel,
                 exp: newExp
               };
             });

             // 미션 완료 후 오늘의 총합 다시 가져오기
             const todayMissions = await getTodayCompletedMissions('YUNJAE');
             const todayTotal = todayMissions.reduce((sum, mission) => {
               return sum + (mission.rewardMoney || 0);
             }, 0);

            const todayTotalGT = todayMissions.reduce((sum, mission) => {
              return sum + (mission.rewardGameTime || 0);
            }, 0);
             setTodayTotalPoints(todayTotal);
             setTodayTotalGameTime(todayTotalGT);

             // 선택된 미션 초기화
             setSelectedMissions({});

             Alert.alert('성공', '미션이 성공적으로 완료되었습니다!');
           } catch (error) {
             console.error('에러 발생:', error);  // 디버깅 로그 추가

             Alert.alert(
               '오류',
               '미션 완료 처리 중 문제가 발생했습니다. 다시 시도해주세요.',
               [{ text: '확인' }]
             );
           }
         }
       }
     ]
   );
 }, [selectedMissions, selectedPoints, selectedGameTime, missions, showLevelUpAnimation]);

  // 기존 레벨업 애니메이션 함수 유지
  const showLevelUpAnimation = useCallback(() => {
    setShowReward(true);
    Animated.sequence([
      Animated.timing(levelUpAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(levelUpAnimation, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowReward(false);
    });
  }, [levelUpAnimation]);


// 미션 완료 데이터를 Firebase에 저장하는 함수
const saveMissionCompletion = async (completedMissions: MissionCompletionData[]) => {
    console.log('saveMissionCompletion 시작', completedMissions); // 시작 로그
 if (!db) {
    console.error('Firebase DB가 초기화되지 않았습니다');
    throw new Error('Firebase DB 초기화 실패');
  }

  try {

    const batch = [];
    console.log('미션 저장 시작...'); // 저장 프로세스 시작 로그

    for (const mission of completedMissions) {
        console.log('저장 시도 중인 미션:', mission); // 각 미션 저장 시도 로그
              try {
                const docRef = await addDoc(collection(db, 'missionCompletionsYUNJAE'), mission);
                console.log('미션 저장 성공:', docRef.id); // 성공 로그
                batch.push(docRef);
              } catch (innerError) {
                console.error('개별 미션 저장 실패:', mission.title, innerError); // 개별 미션 실패 로그
                throw innerError;
              }
    }
    console.log('모든 미션 저장 완료', batch); // 전체 완료 로그

    return batch;
  } catch (error) {
    console.error('미션 저장 중 에러:', error);
    if (error instanceof Error) {
          console.error('에러 메시지:', error.message);
          console.error('에러 스택:', error.stack);
        }
    throw error;
  }
};


// 오늘의 완료된 미션을 가져오는 함수
const getTodayCompletedMissions = async (userId: string) => {
  try {
    console.log('데이터 가져오기 시작');
    // 단순화된 쿼리
    const q = query(
      collection(db, 'missionCompletionsYUNJAE'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // JavaScript에서 필터링
    const todayMissions = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }));

    console.log('필터링된 오늘의 미션:', todayMissions);
    return todayMissions;
  } catch (error) {
    console.error('getTodayCompletedMissions 에러:', error);
    throw error;
  }
};

const fetchUserData = async (userId: string) => {
  try {
    const userDoc = await getDocs(query(collection(db, 'usersYUNJAE'), where('id', '==', userId)));

    if (userDoc.empty) {
      // 사용자가 없으면 새로 생성
      const newUser: User = {
        id: userId,
        name: "ㅋㅋㅋ",
        level: 1,
        exp: 0,
        items: []
      };
      await addDoc(collection(db, 'usersYUNJAE'), newUser);
      return newUser;
    }

    return userDoc.docs[0].data() as User;
  } catch (error) {
    console.error('사용자 데이터 가져오기 실패:', error);
    throw error;
  }
};

// 사용자 정보 업데이트 함수
const updateUserData = async (userId: string, updateData: Partial<User>) => {
  try {
    const userQuery = query(collection(db, 'usersYUNJAE'), where('id', '==', userId));
    const userDocs = await getDocs(userQuery);

    if (!userDocs.empty) {
      // 기존 문서들 모두 삭제
      for (const docSnapshot of userDocs.docs) {
        await deleteDoc(doc(db, 'usersYUNJAE', docSnapshot.id));
      }
    }

    // 새 문서 생성
    await addDoc(collection(db, 'usersYUNJAE'), {
      id: userId,
      ...updateData,
      updatedAt: Timestamp.now() // 업데이트 시간 추가
    });
  } catch (error) {
    console.error('사용자 데이터 업데이트 실패:', error);
    throw error;
  }
};


// 컴포넌트 마운트 시 사용자 정보 가져오기
useEffect(() => {
  const loadUserData = async () => {
    try {
      const userData = await fetchUserData('YUNJAE');
      setCharacter(userData);
    } catch (error) {
      console.error('사용자 데이터 로드 실패:', error);
    }
  };

  loadUserData();
}, []);


// 이름 변경 핸들러 수정
const handleNameChange = async (newName: string) => {
  try {
    // 이름이 비어있지 않을 때만 업데이트
    if (newName.trim()) {
      const updatedCharacter = { ...character, name: newName };
      await updateUserData('YUNJAE', updatedCharacter);
      setCharacter(updatedCharacter);
    }
  } catch (error) {
    console.error('이름 업데이트 실패:', error);
    Alert.alert('오류', '이름 변경에 실패했습니다.');
  }
};



// 이미지 선택 함수 추가
const handleSelectImage = async () => {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: 0.5,
  });

  if (result.assets && result.assets[0].uri) {
    try {
      const updatedCharacter = {
        ...character,
        profileImage: result.assets[0].uri
      };
      await updateUserData('YUNJAE', updatedCharacter);
      setCharacter(updatedCharacter);
          console.log('handleSelectImage 끝');

    } catch (error) {
      console.error('프로필 이미지 업데이트 실패:', error);
      Alert.alert('오류', '이미지 변경에 실패했습니다.');
    }
  }
};

  return (
    <View style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <View style={styles.characterContainer}>
          <TouchableOpacity onPress={handleSelectImage}>
            <View style={styles.profileCircle}>
              {character.profileImage ? (
                <Image
                  source={{ uri: character.profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <Text style={styles.ninjaEmoji}>🦸</Text>
              )}
            </View>
          </TouchableOpacity>
          <TextInput
            style={styles.characterNameInput}
            value={character.name}
            onSubmitEditing={(e) => handleNameChange(e.nativeEvent.text)}
            placeholder="닉네임을 입력하세요"
            placeholderTextColor="#666"
            onChangeText={(text) => setCharacter(prev => ({ ...prev, name: text }))}
          />
          {/* 레벨 텍스트를 터치 가능하게 수정 */}
          <TouchableOpacity onPress={showLevelRewards}>
            <Text style={styles.levelText}>레벨 {character.level} <Text style={styles.viewRewardsText}>(보상 확인하기)</Text></Text>
          </TouchableOpacity>
        </View>

        {/* 프로그레스 바 */}
        <View style={styles.progressContainer}>
          <TouchableOpacity
            style={styles.progressBar}
            onPress={showLevelRewards}
          >
            <View style={styles.progressLabel}>
              <Text style={styles.emoji}>⭐</Text>
              <Text style={styles.progressText}>경험치</Text>
            </View>
            <View style={styles.barContainer}>
              <View style={[styles.barFill, { width: `${character.exp}%`, backgroundColor: '#FFD93D' }]} />
            </View>
            <Text style={styles.percentText}>{character.exp}%</Text>
          </TouchableOpacity>
        </View>

        {/* 점수 현황 */}
        <View style={styles.scoreContainer}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>미션 총합</Text>
            <Text style={styles.scoreValue}>{selectedPoints}원</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>미정산 미션 총합</Text>
            <Text style={styles.scoreValue}>{todayTotalPoints}원</Text>
          </View>
          <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>미정산 GameTime</Text>
              <Text style={styles.scoreValue}>{todayTotalGameTime}분</Text>
          </View>
        </View>
      </View>

      {/* 미션 목록 */}
      <ScrollView style={styles.missionList}>
        {missions.map(mission => (
          <TouchableOpacity
            key={mission.id}
            style={[
              styles.missionCard,
              selectedMissions[mission.id.toString()] && styles.selectedMissionCard
            ]}
            onPress={() => handleMissionSelect(mission)}
          >
            <View style={styles.missionContent}>
              <View style={styles.missionHeader}>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                <View style={[styles.difficultyBadge,
                  { backgroundColor: mission.difficulty === 'EASY' ? '#4CAF50' :
                                   mission.difficulty === 'NORMAL' ? '#FF9800' : '#F44336' }]}>
                  <Text style={styles.difficultyText}>
                    {mission.difficulty === 'EASY' ? '쉬워요!' :
                     mission.difficulty === 'NORMAL' ? '보통이에요!' : '어려워요!'}
                  </Text>
                </View>
              </View>
              <Text style={styles.missionDescription}>{mission.description}</Text>
              <View style={styles.rewardContainer}>
                <Text style={styles.rewardText}>💰{mission.reward.money}원</Text>
                <Text style={[styles.rewardText, styles.rewardTextAlign]}>⭐{mission.reward.exp}EXP</Text>
                {(mission.reward.gameTime > 0) && (
                  <Text style={[styles.rewardText, styles.rewardTextAlign]}>🎮{mission.reward.gameTime}분</Text>
                )}
                <Text style={styles.timeText}>⏱️{mission.estimatedTime}</Text>
              </View>
              {mission.parentApprovalRequired && (
                <Text style={styles.parentApproval}>👨‍👩‍👧‍👦 부모님 도장이 필요해요!</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.startButton}
        onPress={completeMissions}
      >
         <Text style={styles.startButtonText}>
           {selectedGameTime > 0
             ? `선택한 미션 시작하기! (${selectedPoints}원, ${selectedGameTime}분)`
             : `선택한 미션 시작하기! (${selectedPoints}원)`
           }
         </Text>
      </TouchableOpacity>

      {showReward && (
        <Animated.View
          style={[
            styles.levelUpOverlay,
            {
              opacity: levelUpAnimation,
              transform: [{
                scale: levelUpAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1]
                })
              }]
            }
          ]}
        >
          <Text style={styles.levelUpText}>LEVEL UP!</Text>
        </Animated.View>
      )}

      {/* 레벨 보상 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={rewardModalVisible}
        onRequestClose={() => setRewardModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>레벨 보상 목록</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setRewardModalVisible(false);
                  setEditingReward(null);
                  setIsAddingReward(false);
                }}
              >
                <Text style={styles.closeButtonText}>닫기</Text>
              </TouchableOpacity>
            </View>

            {/* 현재 레벨 및 경험치 표시 */}
            <View style={styles.levelInfoContainer}>
              <Text style={styles.currentLevelText}>현재 레벨: {character.level}</Text>
              <Text style={styles.currentExpText}>경험치: {character.exp}/100</Text>
              <Text style={styles.levelInfoText}>다음 레벨까지 {100 - character.exp} EXP 필요</Text>
            </View>

            {/* 레벨 보상 목록 */}
            <ScrollView style={styles.rewardsList}>
              {levelRewards.length > 0 ? (
                levelRewards.map((reward) => (
                  <View key={reward.id} style={[
                    styles.rewardItem,
                    character.level >= reward.level
                      ? (reward.isReceived ? styles.receivedRewardItem : styles.availableRewardItem)
                      : styles.unavailableRewardItem
                  ]}>
                    {editingReward && editingReward.id === reward.id ? (
                      // 편집 모드 UI
                      <View style={styles.editRewardForm}>
                        <TextInput
                          style={styles.editRewardInput}
                          value={newRewardTitle}
                          onChangeText={setNewRewardTitle}
                          placeholder="보상 이름"
                          placeholderTextColor="#999"
                        />
                        <TextInput
                          style={styles.editRewardInput}
                          value={newRewardLevel}
                          onChangeText={setNewRewardLevel}
                          placeholder="레벨"
                          placeholderTextColor="#999"
                          keyboardType="number-pad"
                        />
                        <TextInput
                          style={styles.editRewardInput}
                          value={newRewardDescription}
                          onChangeText={setNewRewardDescription}
                          placeholder="설명 (선택사항)"
                          placeholderTextColor="#999"
                          multiline
                        />
                        <View style={styles.editButtonsRow}>
                          <TouchableOpacity
                            style={[styles.editButton, { backgroundColor: '#4CAF50' }]}
                            onPress={saveEditingReward}
                          >
                            <Text style={styles.editButtonText}>저장</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.editButton, { backgroundColor: '#f44336' }]}
                            onPress={() => setEditingReward(null)}
                          >
                            <Text style={styles.editButtonText}>취소</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      // 일반 보기 모드 UI
                      <View style={styles.rewardContent}>
                        <View style={styles.rewardHeader}>
                          <View style={styles.rewardInfo}>
                            <Text style={styles.rewardLevelText}>레벨 {reward.level}</Text>
                            <Text style={styles.rewardTitle}>{reward.title}</Text>
                          </View>
                          <Switch
                            value={reward.isReceived}
                            onValueChange={() => toggleRewardReceived(reward)}
                            disabled={character.level < reward.level}
                            trackColor={{ false: '#767577', true: '#4CAF50' }}
                            thumbColor={reward.isReceived ? '#fff' : '#f4f3f4'}
                          />
                        </View>

                        {reward.description && (
                          <Text style={styles.rewardDescription}>{reward.description}</Text>
                        )}

                        <View style={styles.rewardStatus}>
                          {character.level < reward.level ? (
                            <Text style={styles.rewardStatusUnavailable}>
                              {reward.level - character.level}레벨 남음
                            </Text>
                          ) : reward.isReceived ? (
                            <Text style={styles.rewardStatusReceived}>수령완료</Text>
                          ) : (
                            <Text style={styles.rewardStatusAvailable}>수령가능</Text>
                          )}

                          <View style={styles.rewardActions}>
                            <TouchableOpacity
                              style={styles.rewardActionButton}
                              onPress={() => startEditingReward(reward)}
                            >
                              <Text style={styles.rewardActionButtonText}>수정</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.rewardActionButton, styles.deleteButton]}
                              onPress={() => {
                                Alert.alert(
                                  '보상 삭제',
                                  '정말 이 보상을 삭제하시겠습니까?',
                                  [
                                    { text: '취소', style: 'cancel' },
                                    {
                                      text: '삭제',
                                      onPress: () => reward.id && deleteLevelReward(reward.id),
                                      style: 'destructive'
                                    }
                                  ]
                                );
                              }}
                            >
                              <Text style={styles.rewardActionButtonText}>삭제</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>등록된 레벨 보상이 없습니다.</Text>
                  <Text style={styles.noDataSubText}>아래 버튼을 눌러 새로운 보상을 추가해보세요!</Text>
                </View>
              )}

              {/* 새 보상 추가 폼 */}
              {isAddingReward && (
                <View style={styles.addRewardForm}>
                  <Text style={styles.addRewardTitle}>새 보상 추가</Text>
                  <TextInput
                    style={styles.addRewardInput}
                    value={newRewardTitle}
                    onChangeText={setNewRewardTitle}
                    placeholder="보상 이름 (예: 닌자고 상품명 사주기)"
                    placeholderTextColor="#999"
                  />
                  <TextInput
                    style={styles.addRewardInput}
                    value={newRewardLevel}
                    onChangeText={setNewRewardLevel}
                    placeholder="달성 레벨 (예: 5)"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                  />
                  <TextInput
                    style={[styles.addRewardInput, styles.addRewardDescription]}
                    value={newRewardDescription}
                    onChangeText={setNewRewardDescription}
                    placeholder="설명 (선택사항)"
                    placeholderTextColor="#999"
                    multiline
                  />
                  <View style={styles.addRewardButtons}>
                    <TouchableOpacity
                      style={[styles.addRewardButton, styles.addButton]}
                      onPress={addLevelReward}
                    >
                      <Text style={styles.addRewardButtonText}>추가하기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.addRewardButton, styles.cancelButton]}
                      onPress={() => {
                        setIsAddingReward(false);
                        setNewRewardTitle('');
                        setNewRewardLevel('');
                        setNewRewardDescription('');
                      }}
                    >
                      <Text style={styles.addRewardButtonText}>취소</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* 보상 추가 버튼 */}
            {!isAddingReward && (
              <TouchableOpacity
                style={styles.addNewRewardButton}
                onPress={() => {
                  setIsAddingReward(true);
                  setEditingReward(null);
                }}
              >
                <Text style={styles.addNewRewardButtonText}>새 레벨 보상 추가</Text>
              </TouchableOpacity>
            )}
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
    backgroundColor: '#fff',
    padding: 20,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
    elevation: 5,
  },
  characterContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileCircle: {
    width: 80,
    height: 80,
    backgroundColor: '#E8F5E9',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  ninjaEmoji: {
    fontSize: 40,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  characterName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  characterNameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
    textAlign: 'center',
    padding: 5,
    minWidth: 150,
  },
  levelText: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
  },
  viewRewardsText: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  emoji: {
    fontSize: 18,
    marginRight: 5,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  barContainer: {
    flex: 1,
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    marginHorizontal: 10,
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  percentText: {
    width: 40,
    fontSize: 14,
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: 15,
    padding: 10, // Reduced padding
  },
  scoreBox: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12, // Reduced font size
    color: '#2E7D32',
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 16, // Reduced font size
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  missionList: {
    padding: 20,
  },
  missionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedMissionCard: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  missionContent: {
    // Existing styles
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  missionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  rewardText: {
    fontSize: 14,
    color: '#1B5E20',
    alignSelf: 'center', // 모든 플랫폼
    textAlignVertical: 'center', // 안드로이드용
    marginRight: 15,
    paddingBottom: 3, // 미세하게 아래로 조정
  },
  rewardTextAlign: {
    textAlignVertical: 'center', // 안드로이드용
    alignSelf: 'center', // 모든 플랫폼
    paddingBottom: 0, // 미세하게 아래로 조정
  },

  timeText: {
    fontSize: 14,
    color: '#666',
    paddingBottom: 0, // 미세하게 아래로 조정
  },
  parentApproval: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 5,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  levelUpOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  levelUpText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },

  // 모달 관련 스타일
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

  // 레벨 정보 스타일
  levelInfoContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  currentLevelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 5,
  },
  currentExpText: {
    fontSize: 16,
    color: '#2E7D32',
    marginBottom: 5,
  },
  levelInfoText: {
    fontSize: 14,
    color: '#388E3C',
  },

  // 레벨 보상 목록 스타일
  rewardsList: {
    flex: 1,
    marginBottom: 15,
  },
  rewardItem: {
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    elevation: 3,
  },
  unavailableRewardItem: {
    backgroundColor: '#f5f5f5',
    borderLeftWidth: 5,
    borderLeftColor: '#9E9E9E',
  },
  availableRewardItem: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 5,
    borderLeftColor: '#FFB300',
  },
  receivedRewardItem: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  rewardContent: {
    // Content container
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardLevelText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  rewardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  rewardStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  rewardStatusUnavailable: {
    fontSize: 14,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  rewardStatusAvailable: {
    fontSize: 14,
    color: '#FFB300',
    fontWeight: 'bold',
  },
  rewardStatusReceived: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  rewardActions: {
    flexDirection: 'row',
  },
  rewardActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginLeft: 5,
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  rewardActionButtonText: {
    fontSize: 12,
    color: '#666',
  },

  // 보상 추가 및 편집 관련 스타일
  addRewardForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  addRewardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 15,
    textAlign: 'center',
  },
  addRewardInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addRewardDescription: {
    height: 80,
    textAlignVertical: 'top',
  },
  addRewardButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  addRewardButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    margin: 5,
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  addRewardButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  // 편집 폼 스타일
  editRewardForm: {
    // Similar to addRewardForm
  },
  editRewardInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  editButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    margin: 5,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  // 새 보상 추가 버튼
  addNewRewardButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  addNewRewardButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  // 데이터 없음 표시
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 10,
    textAlign: 'center',
  },
  noDataSubText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },

});