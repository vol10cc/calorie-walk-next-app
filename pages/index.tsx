import Head from "next/head";
import React, { useState, useMemo } from "react";
import { db, storage } from "../firebaseConfig.js";
import {
  collection,
  setDoc,
  doc,
  addDoc,
  deleteDoc,
  limit,
} from "firebase/firestore";
import { query, orderBy, where } from "firebase/firestore";
import { onSnapshot, getDocs } from "firebase/firestore";
import { ref } from "firebase/storage";
import dynamic from "next/dynamic";

export default function Home() {
  //1回目の緯度
  const [latitude, setLatitude] = useState(0);
  //1回目の経度
  const [longitude, setLongitude] = useState(0);
  //1回目のID
  const [firstID, setfirstID] = useState("");
  //2回目の緯度
  const [secondlatitude, setsecondLatitude] = useState(0);
  //2回目の経度
  const [secondlongitude, setsecondLongitude] = useState(0);
  //2回目のID
  const [secondID, setsecondID] = useState("");
  //食べ物の読み込み
  const [foodprocess, setFoodprocess] = useState(false);
  //食べ物
  const [foods, setFoods] = useState<any[]>([]);
  //距離
  const [calorie, setCalorie] = useState(0);
  //体重
  const [kg, setKg] = useState(0);
  //カロリー
  const [distance, setDistance] = useState(0);
  //歩数
  const [step, setStep] = useState(0);
  //処理中フラグ
  const [processing, setProcessing] = useState(false);

  //初回ローディングフラグ
  const [loading, setLoading] = useState(false);

  const [firedata, setFiredata] = useState<any[]>([]);
  const [currentfiredata, setcurrentFiredata] = useState<any[]>([]);

  //初回の緯度・経度取得
  React.useEffect(() => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition((position) => {
      console.log(position.coords);
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
      getfirst();
      getsecond();
      getfoods();
    });
    navigator.geolocation.getCurrentPosition((position) => {
      console.log(position.coords);
      setsecondLatitude(position.coords.latitude);
      setsecondLongitude(position.coords.longitude);
      getfirst();
      getsecond();
      getfoods();
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getfirst = async () => {
    const firstCollectionRef = collection(db, "first");
    getDocs(firstCollectionRef).then((querySnapshot) => {
      return setFiredata(
        querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
      );
    });
    setfirstID(firedata[0]?.id);
    console.log(firstID);
    setLoading(false);
  };

  const getsecond = async () => {
    const currentCollectionRef = collection(db, "current");
    getDocs(currentCollectionRef).then((querySnapshot) => {
      return setcurrentFiredata(
        querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
      );
    });
  };

  const getfoods = async () => {
    //データベースを取得
    const foodCollectionRef = collection(db, "foods");
    const q = query(foodCollectionRef, orderBy("calorie", "desc"));
    await getDocs(q).then((querySnapshot) => {
      //コレクションのドキュメントを取得
      setFoods(
        querySnapshot.docs.map((data) => {
          //配列なので、mapで展開する
          return { ...data.data(), id: data.id };
          //スプレッド構文で展開して、新しい配列を作成
        })
      );
    });
  };

  //初回緯度経度firestoreにデータ保存
  const addfirstDate = async () => {
    if (processing) return;
    // 処理中フラグを上げる
    setProcessing(true);
    const firstRef = collection(db, "first");
    const newdate = new Date().toLocaleString("ja-JP");
    console.log(latitude);
    console.log(longitude);
    await addDoc(firstRef, {
      latitude: latitude,
      date: newdate,
      longitude: longitude,
    })
      .then(() => {
        console.log("投稿ができました！");
        setProcessing(false);
        getfirst();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // const removeDate = () => {
  //   let fieldToEdit = doc(db, "first", firstID);
  //   deleteDoc(fieldToEdit)
  //     .then(() => {
  //       alert("記事を削除しました");
  //     })
  //     .catch((err) => {
  //       alert("記事の削除に失敗しました");
  //     });
  // };

  // 二点間の座標から距離を求める
  function calcDistance(
    nowLatitude: number,
    nowLongitude: number,
    prevLatitude: number,
    prevLongitude: number
  ): number {
    const R = Math.PI / 180.0;
    const EarthRadius = 6371;
    nowLatitude *= R;
    nowLongitude *= R;
    prevLatitude *= R;
    prevLongitude *= R;
    const res =
      EarthRadius *
      Math.acos(
        Math.cos(prevLatitude) *
          Math.cos(nowLatitude) *
          Math.cos(nowLongitude - prevLongitude) +
          Math.sin(prevLatitude) * Math.sin(nowLatitude)
      );
    return res;
  }

  const GetCurrentGeo = async () => {
    if (processing) return;
    // 処理中フラグを上げる
    setProcessing(true);
    const prevLatitude = firedata[0]?.latitude;
    const prevLongtitude = firedata[0]?.longitude;
    //ボタンを押したら，latitudeとlongitudeを設定

    await navigator.geolocation.getCurrentPosition((position) => {
      setsecondLatitude(position.coords.latitude);
      setsecondLongitude(position.coords.longitude);
      console.log(secondlatitude);
      console.log(secondlongitude);
      console.log(prevLatitude);
      console.log(prevLongtitude);
      setDistance(
        calcDistance(
          secondlatitude,
          secondlongitude,
          prevLatitude,
          prevLongtitude
        )
      );
    });

    // setStep(Math.round(distance * 1400));
    // setCalorie(Math.round(distance * kg));
    // console.log("結果がでました！");
    // console.log(Math.round(distance));
    // getsecond();
    // getfoods();
    // setProcessing(false);
    setFoodprocess(true);
    const firstRef = collection(db, "current");
    const newdate = new Date().toLocaleString("ja-JP");
    setStep(Math.round(distance * 1400));
    setCalorie(Math.round(distance * kg));
    await addDoc(firstRef, {
      latitude: latitude,
      date: newdate,
      longitude: longitude,
    })
      .then(() => {
        console.log("結果がでました！");
        console.log(distance);
        setProcessing(false);
        getsecond();
        getfoods();
      })
      .catch((err) => {
        console.log(err);
        setDistance(0);
      });
  };
  const Map = React.useMemo(
    () =>
      dynamic(() => import("../components/map"), {
        loading: () => <p>A map is loading</p>,
        ssr: false,
      }),
    [firedata]
  );
  return (
    <>
      <Head>
        <title>カロリー計算 | App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header>
        <a href="#" className="return-top">
          GeoLunch
        </a>
      </header>
      <div className="center">
        <div className="btn-margin">
          <button
            id="btn"
            className="btn btn-outline-primary btn-lg"
            onClick={addfirstDate}
          >
            最初の位置を取得する
          </button>
        </div>
        <div className="center-input">
          <label>体重 </label>
          <input
            onChange={(e: any) => setKg(e.target.value)}
            type="text"
          ></input>{" "}
          kg
        </div>
        <div className="btn-margin">
          <button
            id="btn"
            className="btn btn-outline-primary btn-lg"
            onClick={GetCurrentGeo}
          >
            現在の位置を取得して、計算する
          </button>
        </div>
        <div className="max-1000">
          <h3>最初の位置</h3>
          <div className="txt-margin">
            {loading && <p>読み込み中・・・</p>}
            {firedata.map((data) => (
              <div key={data.id}>
                <div>
                  <p>
                    緯度：<span id="latitude">{data.latitude}</span>
                    <span>度</span>
                  </p>
                  <p>
                    経度：<span id="longitude">{data.longitude}</span>
                    <span>度</span>
                  </p>
                  <Map latitude={data.latitude} longitude={data.longitude} />
                </div>
              </div>
            ))}
          </div>

          <div className="food">
            {/* TODO: 食べていいものをDBから引っ張ってきて表示させる */}
            {foodprocess && (
              <>
                <h3>2回目の位置</h3>
                <div className="txt-margin">
                  <p>
                    緯度：<span id="latitude">{secondlatitude}</span>
                    <span>度</span>
                  </p>
                  <p>
                    経度：<span id="longitude">{secondlongitude}</span>
                    <span>度</span>
                  </p>
                  <Map latitude={secondlatitude} longitude={secondlongitude} />
                  {/* </div> */}
                  {/* ))} */}
                </div>
                <h3>結果</h3>
                <div className="distance">
                  <p>
                    現在歩いた距離:
                    <span id="distance">{Math.round(distance)}</span>
                    <span>km</span>
                  </p>
                </div>
                <div className="distance">
                  <p>
                    現在歩いたカロリー:<span id="distance">{calorie}</span>
                    <span>カロリー</span>
                  </p>
                </div>
                <div className="step">
                  <p>
                    現在歩いた歩数:<span id="step">{step}</span>
                    <span>歩</span>
                  </p>
                </div>
                <h3>食べられる食事</h3>
                <div className="flx">
                  {foods.map((food) => (
                    <div key={food.id} className="flx_el">
                      {food.calorie < calorie + 100 &&
                        food.calorie > calorie - 100 && (
                          <div>
                            <img src={food.imageurl}></img>
                            <p>
                              品目<p id="latitude">{food.name}</p>
                            </p>
                            <p>
                              カロリー
                              <p id="latitude">{food.calorie}kcal</p>
                            </p>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
