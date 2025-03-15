# moneymanager

React Native 윈도우에서 설치할땐 어떻게 해?
ChatGPT의 말:
✅ Windows에서 React Native 빌드 환경 설정하기
Windows에서 React Native 앱을 빌드하려면 몇 가지 필수 프로그램을 설치해야 합니다.
🛠 1. 필수 프로그램 설치
1️⃣ Node.js & npm 또는 yarn
Node.js 공식 사이트에서 최신 LTS 버전 다운로드 후 설치
설치 후 버전 확인:
powershell
node -v npm -v
2️⃣ React Native CLI 설치
글로벌 설치:
powershell
npm install -g react-native-cli
3️⃣ JDK (Java Development Kit) 설치
Android 개발을 위해 필요
JDK 17 권장
Adoptium JDK 다운로드
4️⃣ Android Studio 설치 (Android 앱 빌드시 필수)
Android Studio 다운로드
설치할 구성 요소 선택:
Android SDK
Android SDK Command-line Tools
Android Virtual Device (AVD) (에뮬레이터 사용 시)
설치 후 환경 변수 설정 필요 (아래 참고)
5️⃣ C++ Build Tools 설치
Windows에서 네이티브 모듈을 빌드하기 위해 필요
PowerShell을 관리자 권한으로 실행하고 다음 명령어 입력:
powershell
npx react-native doctor
Chocolatey를 사용해 windows-build-tools 설치 가능
🖥 2. 환경 변수 설정
ANDROID_HOME을 설정해야 합니다.
1️⃣ 환경 변수 추가 (ANDROID_HOME, SDK 경로 설정)
시스템 환경 변수 편집 검색 후 실행
고급 → 환경 변수 클릭
시스템 변수에서 새로 만들기
변수 이름: ANDROID_HOME
변수 값: C:\Users\{사용자이름}\AppData\Local\Android\Sdk
Path 변수에 다음 경로 추가
perl
%ANDROID_HOME%\platform-tools %ANDROID_HOME%\emulator %ANDROID_HOME%\tools %ANDROID_HOME%\tools\bin
확인 클릭 후 재부팅
설정 확인:
powershell
echo %ANDROID_HOME%

참고로 코드는 클로드라는 AI를 사용해서 만들었습니다.

firebase(용돈 데이터 가 쌓이는 곳)
firebase 사용법도 알려줘
ChatGPT의 말:
🔥 React Native에서 Firebase 사용법
React Native에서 Firebase를 사용하려면 Firebase SDK를 설치하고, Firebase 프로젝트를 생성 및 연결해야 합니다.
🛠 1. Firebase 프로젝트 생성
Firebase 콘솔 접속
프로젝트 추가 → 프로젝트 이름 입력
"Google 애널리틱스 활성화" 선택 (필요한 경우)
프로젝트 생성 후 "앱 추가" 선택
Android: 패키지 이름 필요 (com.example.myapp 형식)
iOS: Bundle ID 필요 (com.example.myapp 형식)
Google-Services 파일 다운로드
Android: google-services.json을 android/app 폴더에 추가
iOS: GoogleService-Info.plist를 ios/ 폴더에 추가
📦 2. Firebase 패키지 설치
React Native에서 Firebase를 사용하려면 react-native-firebase 패키지를 설치해야 합니다.
1️⃣ Firebase Core 설치 (필수)
bash
npm install @react-native-firebase/app
2️⃣ 사용할 기능별 패키지 추가
npm install @react-native-firebase/database


> 개발방법
App.tsx 안에 미션들을 수정한다.
1)을 이용해 수정 및 테스트를 하고
2)을 이용해 핸드폰이나, 테블릿에 설치한다. (전 apk를 만들어서 메일로 보내서 설치합니다.)

빌드해서 바로 테블릿에서 테스트 하기
C:\ReactNativeProjects\Home\PocketMoneyApp_yunjae 에서
npx react-native run-android

2. 핸드폰이나, 테블릿에 설치 할때 apk 파일 만드는 방법
C:\ReactNativeProjects\Home\PocketMoneyApp_yunjae\android 에서
gradlew.bat assembleRelease 실행.
