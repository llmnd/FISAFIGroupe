import "@/styles/modules/about.css";

const BACKGROUND_IMAGE =
  "https://i.pinimg.com/originals/eb/07/16/eb07167d0e3f1dcb1803d329f56350eb.gif";

export default function AboutStripSlideshow() {
  return (
    <div
      className="about-strip-visual"
      style={{ backgroundImage: `url('${BACKGROUND_IMAGE}')` }}
      aria-hidden="true"
    >
      <div className="about-strip-overlay" />
      <p className="about-quote">
        « Pensez grand.
        <br />
        Pensez digital.
        <br />
        Pensez <em>FISAFI</em>. »
      </p>
    </div>
  );
}