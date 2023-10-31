import "./index.css";
import { BsGithub } from "react-icons/bs";
import { FaSquareXTwitter } from "react-icons/fa6";
import { MdDarkMode, MdOutlineLightMode } from "react-icons/md";

function App() {
  return (
    <div>
      <header className="h-16 text-xl flex justify-around items-center border-b-2 border-gray-300">
        <div className="logo font-bold text-2xl">Pt</div>
        <div className="header">
          <ul className="flex flex-row m-3 space-x-10">
            <li className="cursor-pointer p-2 font-semibold">Home</li>
            <li className="cursor-pointer p-2 font-semibold">About</li>
            <li className="cursor-pointer p-2 font-semibold">Contact</li>
          </ul>
        </div>
        <div className="social-links">
          <ul className="flex flex-row space-x-4 items-center justify-center">
            <div className="flex flex-row space-x-2 border-2 rounded-3xl p-1 border-gray-500">
              <MdDarkMode className="cursor-pointer text-xl " />
              <MdOutlineLightMode className="cursor-pointer text-xl " />
            </div>
            <a href="https://github.com/the-shivam-gupta" target="_blank">
              <BsGithub className="cursor-pointer text-2xl" />
            </a>
            <a href="https://twitter.com/ShivamGupt97925" target="_blank">
              <FaSquareXTwitter className="cursor-pointer text-2xl" />
            </a>
          </ul>
        </div>
      </header>
    </div>
  );
}

export default App;
