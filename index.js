const puppeteer = require('puppeteer');
const cronJob = require('node-cron');
const mailer = require('nodemailer');

const urlDevice = `https://tiki.vn/tai-nghe-bluetooth-apple-airpods-2-true-wireless-mv7n2-nhap-khau-chinh-hang-hop-sac-thuong-p46623654.html?src=search&2hi=1&keyword=airpod`;

const PRICE_CAN_BY = 4000000;
const USER = 'nguyendai.dev.clone@gmail.com';
const PASS = 'Aloalo123';

async function accessPage(page) {
  return await page.$eval('#p-specialprice #span-price', el => el.innerHTML);
}

async function createBrowser(browser) {
  console.log(`========== Doing get price of the device ... ========== \n`);
  const page = await browser.newPage();
  await page.goto(urlDevice);

  return await accessPage(page);
}

async function getPriceOfDevice(strPriceOfDevice) {
  const priceFormatNumber = +strPriceOfDevice.replace(/\D/g, '');
  return priceFormatNumber;
}

async function actions(browser) {
  const strPriceOfDevice = await createBrowser(browser);
  const price = await getPriceOfDevice(strPriceOfDevice);
  if (price < PRICE_CAN_BY) {
    sendMail(strPriceOfDevice);
    return true;
  }
  return false;
}

function sendMail(priceOfDevice) {
  console.log(`Sending to your gmail `);
  const transporter = mailer.createTransport({
    service: 'gmail',
    auth: {
      user: USER,
      pass: PASS
    }
  });
  const mailOptions = {
    from: 'Nguyen Dai',
    to: 'nguyendai.coder@gmail.com',
    subject: 'Theo dõi giá của Airpod 2',
    text: 'Giá airpod 2 đã giảm mua mua ngay nào. Nhớ kiểm tra ví nhé <3 !!!',
    html: `
    <div>
      <p>Giá airpod 2 đã giảm xuống: <strong style="color: red">${priceOfDevice}</strong>. Hãy nhớ kiểm tra ví xem có đủ không nhé <3 !!!</p>
      <b>Click vào đây để đến trang Airpod 2: ${urlDevice}</b>
    </div>`
  };
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.error(`Send mail failed ...`);
    } else {
      console.log(`Send email successfully ...`);
    }
  });
}

(async () => {
  const browser = await puppeteer.launch({
    args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage']
  });
  // FIXME: schedule after every 10 seconds, it will call to check price on TIKI
  let checkCancel = false;

  const task = cronJob.schedule('*/10 * * * * *', async function() {
    checkCancel = await actions(browser);
    browser.on('disconnected', function() {});
    if (checkCancel) {
      console.log(`Task is done. Stop !!!`);
      task.stop();
    }
  });
})();
