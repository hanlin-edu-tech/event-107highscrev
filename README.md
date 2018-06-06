# 高中學測課程廣告介紹頁 (6月預購版)

## 開發時編譯
```
gulp build
```

## 開發完成打包
```
gulp package
```

##GCP Deploy
```sh
gsutil -m rm -r gs://tutor-events/event/107highscrev/*
gsutil -m cp -r -a public-read dist gs://tutor-events/event/107highscrev
```