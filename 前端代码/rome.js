window.onload = function () {
  // 传输视频，不传输音频
  const mediaStreamConstraints = {
    video: true,
    audio: true
  };

  // 设置两个video，分别显示本地视频流和远端视频流
  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  let localPeerConnection;
  let timer
  let transceiver = null
  var webcamStream = null;

  // 请更换成你node本地跑起来 所在的 ip地址     
  let getUrl = "http://nodeip 地址:3001/data/remo"
  let postUrl = "http://node 所在ip地址:3001/data/local"



  // 开始呼叫
  $('#startButton').click(function () {
    startQuery()
  })
  // 点击调用
  $('#callButton').click(function () {
    startQuery()
    startAction()
  })


  // 这个方法循环去请求去
  function startQuery () {
    timer = setInterval(function () {
      $.ajax({
        type: "GET",
        url: getUrl,
        success: function (res) {
          console.log('远端请求')
          console.log(res)
          if (res === '11' || res === ' ') {

          } else {
            let msg = JSON.parse(res)
            // 做检测
            chackData(msg)
          }

        },
        error: function (res) {

        }
      })
    }, 1000)
  }

  $("#hangupButton").click(function () {
    clearInterval(timer)
  })

  // 检测函数
  function chackData (msg) {
    console.log('收到-远端-type' + msg.MessageType)
    switch (msg.MessageType) {
      case '1':
        handleVideoOfferMsg(msg);
        break;
      case '2':
        handleVideoAnswerMsg(msg);
        break;
      case '3':
        handleNewICECandidateMsg(msg);
        break;
    }
  }

  // 返回需要发送的数据
  function sendDataByType (type) {
    console.log(localPeerConnection.localDescription.sdp)
    let obj = {
      Data: localPeerConnection.localDescription.sdp,
      IceDataSeparator: ' '
    }
    switch (type) {
      case "Offer":
        obj.MessageType = '1';
        break;
      case "Answer":
        obj.MessageType = '2';
        break;
    }
    return obj
  }

  // 收到别的 offer 需要调用post发送 内容
  async function handleVideoOfferMsg (msg) {
    console.log('远端-收到offer')
    if (!localPeerConnection) {
      createPeerConnection();
    }
    let obj = {
      "type": "offer",
      "sdp": msg.Data
    }
    var desc = new RTCSessionDescription(obj);
    localPeerConnection.setRemoteDescription(desc)


    if (!webcamStream) {
      try { // 播放本地视频
        webcamStream = await navigator.mediaDevices.getUserMedia(mediaStreamConstraints);
        console.log('--------本地的被动视频流---------')
        localVideo.srcObject = webcamStream
        console.log(webcamStream)

      } catch (err) {
        handleGetUserMediaError(err);
        return;
      }
      try {
        webcamStream.getTracks().forEach(
          transceiver = track => localPeerConnection.addTransceiver(track, { streams: [webcamStream] })
        );
      } catch (err) {
        handleGetUserMediaError(err);
      }
    }
    await localPeerConnection.setLocalDescription(await localPeerConnection.createAnswer());
    console.log(localPeerConnection)
    // 调用 post 请求 回复 
    /////////////////////////////////////////////////
    let objs = sendDataByType('Answer')
    startPost(objs)
  }

  // 收到answer
  async function handleVideoAnswerMsg (msg) {
    console.log('收到answer')
    let obj = {
      "type": "answer",
      "sdp": msg.Data
    }
    var desc = new RTCSessionDescription(obj);
    console.log(desc)
    await localPeerConnection.setRemoteDescription(desc).catch();
  }

  // 收到ice
  async function handleNewICECandidateMsg (msg) {
    console.log(msg)
    let arr = msg.Data.split(msg.IceDataSeparator)
    console.log(arr)
    let obj = {
      "candidate": arr[0],
      "sdpMid": arr[1],
      "sdpMLineIndex": arr[2]
    }
    var candidate = new RTCIceCandidate(obj);
    try {
      await localPeerConnection.addIceCandidate(candidate)
    } catch (err) {
      console.log('iec 调用失败')
      console.log(err)
    }
  }

  // post请求方法
  function startPost (obj) {
    console.log(obj)
    $.ajax({
      type: "post",
      url: postUrl,
      data: obj,
      dataType: 'json',
      success: function (res) {
        console.log(res)
      },
      error: function (res) {

      }
    })
  }


  // 获取本地视频
  async function startAction () {
    startButton.disabled = true;
    createPeerConnection()

    try { // 播放本地视频
      webcamStream = await navigator.mediaDevices.getUserMedia(mediaStreamConstraints);
      console.log('--------本地的---------')
      localVideo.srcObject = webcamStream
      console.log(webcamStream)

    } catch (err) {
      handleGetUserMediaError(err);
      return;
    }
    try {
      webcamStream.getTracks().forEach(
        transceiver = track => localPeerConnection.addTransceiver(track, { streams: [webcamStream] })
      );
    } catch (err) {
      handleGetUserMediaError(err);
    }
  }


  async function createPeerConnection () {
    localPeerConnection = new RTCPeerConnection();
    localPeerConnection.onicecandidate = handleICECandidateEvent;
    localPeerConnection.ontrack = handleTrackEvent;
    localPeerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
  }

  function handleICECandidateEvent (event) {
    console.log('准备回调ice事件')
    console.log(event.candidate)
    if (event.candidate) {
      let obj = {
        Data: event.candidate.candidate + '|' + event.candidate.sdpMid + '|' + event.candidate.sdpMLineIndex,
        MessageType: 3,
        IceDataSeparator: '|'
      }
      startPost(obj)
    }
  }


  function handleTrackEvent (event) {
    const mediaStream = event.streams[0];
    remoteVideo.srcObject = mediaStream;
    remoteStream = mediaStream;
  }

  async function handleNegotiationNeededEvent () {
    console.log('进入 createOffer()')
    try {
      const offer = await localPeerConnection.createOffer();
      await localPeerConnection.setLocalDescription(offer);
      let obj = sendDataByType('Offer')
      console.log(obj)
      startPost(obj)
    } catch{

    }
  }
}

function handleGetUserMediaError (e) {
  console.log(e);
  switch (e.name) {
    case "NotFoundError":
      alert("Unable to open your call because no camera and/or microphone" +
        "were found.");
      break;
    case "SecurityError":
    case "PermissionDeniedError":
      // Do nothing; this is the same as the user canceling the call.
      break;
    default:
      alert("Error opening your camera and/or microphone: " + e.message);
      break;
  }
}