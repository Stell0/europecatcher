import { drawBottle, drawCap, INK, PAPER } from './art.js';

export async function createReport(score, url) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = PAPER;ctx.fillRect(0, 0, 1080, 1080);
  ctx.strokeStyle = INK;ctx.lineWidth = 2;ctx.strokeRect(35, 35, 1010, 1010);
  ctx.fillStyle = INK;ctx.textAlign = 'left';
  ctx.font = 'bold 23px Georgia';ctx.fillText('DIRECTORATE FOR CAP REUNIFICATION', 78, 93);
  ctx.font = '18px "Courier New", monospace';ctx.fillText('FORM CR-12 / FINAL INSPECTION', 78, 128);
  ctx.beginPath();ctx.moveTo(78, 154);ctx.lineTo(1002, 154);ctx.stroke();
  ctx.font = 'bold 76px Georgia';ctx.fillText('UNCAP EUROPE', 74, 245);
  ctx.font = 'italic 36px Georgia';ctx.fillText('Cap Reunification Report', 78, 300);
  ctx.font = 'bold 23px Arial';ctx.fillText('CAPS REUNITED', 82, 397);
  const digits = String(score);
  ctx.font = `bold ${digits.length > 5 ? 105 : 180}px Georgia`;
  ctx.fillText(digits, 70, 572, 610);
  ctx.font = '26px Georgia';ctx.fillText('All twelve stars exhausted.', 82, 631);
  ctx.fillText('The paperwork remains.', 82, 670);
  drawBottle(ctx, 830, 378, 130, 285);
  drawCap(ctx, 850, 335, 27, -0.2);
  ctx.save();ctx.translate(310, 782);ctx.rotate(-0.09);ctx.strokeStyle = '#9d3832';ctx.fillStyle = '#9d3832';
  ctx.lineWidth = 4;ctx.strokeRect(-225, -53, 450, 106);ctx.lineWidth = 1;ctx.strokeRect(-217, -45, 434, 90);
  ctx.textAlign = 'center';ctx.font = 'bold 56px Georgia';ctx.fillText('CASE CLOSED', 0, 19);ctx.restore();
  ctx.fillStyle = INK;ctx.font = 'italic 31px Georgia';ctx.fillText('Your inspection is next.', 82, 917);
  ctx.beginPath();ctx.moveTo(78, 956);ctx.lineTo(1002, 956);ctx.strokeStyle = INK;ctx.lineWidth = 1;ctx.stroke();
  ctx.font = '19px "Courier New", monospace';ctx.fillText(url, 82, 995, 910);
  const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG export failed')), 'image/png'));
  return { blob, file: new File([blob], `uncap-europe-${score}.png`, { type: 'image/png' }) };
}
