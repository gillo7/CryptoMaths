# Prelude: setting up the lab

In this chapter, we will be setting up our lab environment that will be used in the remainder of the book.

You can use many different setups if you prefer, but keep in mind that all practical exercises and challenges will assume that you have installed the following lab with the specific software and OS versions mentioned.

You may find that the instructions differ in the GitHub and the book? It's normal. Cryptography and Networking are fast-changing areas, and many things that work perfectly one year may be broken by unforeseen deprecation or dependencies the next. Always assume that the most up to date information is found in the GitHub repository.

You do not need an advanced computing, networking, mathematic or programming knowledge to do this setup or to follow the exercises, however, this book will assume that you have at least some familiarity with these areas. If you struggle, I can only suggest researching online or on YouTube for more specific tutorials.

## Part 1 - Setup your workbench

In this first part, we're going to collect the tools we need and set up our work space. 

### Step 1 - Register to GitHub

I am always amazed to meet 4th year university students, here in Napier -where I work- who never created a single repo! How can one work this way?

If you're already familiar with GitHub and already have an account, skip this and move on to the next step.

If not, what is GitHub? GitHub is the online, web-based cousin of Git, the second present to the world made by a certain Linus Torvalds (if you do not know who that is, look it up!)

It essentially is a web application which allows you to save, update, version and share your work. Each project gets its own *repository* (usually shortened into repo). The really cool thing is that you can then copy this repository onto your laptop (*clone* it), work on it, then upload the changes (*push* it). If anyone else makes changes to it, you can download the changes (*pull* them). This allows you to keep a neat and safe version of your work, available everywhere with just a few command lines!


Head to [GitHub](https://github.com/signup) and sign up for a free account!

Remember to use a sensible name for your account, by definition, at some point you might want to share it with others.


![GitHub Dashboard](images/prelude-github-dashboard.png)
*The GitHub Dashboard*

### Step 2 - Install Visual Studio Code

Now that we have a GitHub account setup, let's setup our workbench. Microsoft Visual Studio Code (VS Code) is probably the most used and most convenient code editor there is. It has countless extensions in its library, and integrates terminal, GitHub and AI in a single place where you can read, work and save your work in a convenient way.

It is available on all platforms, for free.


Head to [Visual Studio Code](https://code.visualstudio.com/download), then download and install VS Code.


![VS Code](images/prelude-vscode.png)
*Visual Studio Code*

### Step 3 - Install Git

Git is the engine that works behind GitHub. If your machine does not have it installed yet, follow the instructions to install it

In VS Code, open a Terminal (click on the top menu, or use the shortcut Ctrl+`, Ctrl even on a Mac)

![New Terminal](images/prelude-vscode-new-terminal.png)
*Opening a new terminal*

![Terminal open](images/prelude-vscode-terminal-open.png)
*New Terminal*

Now copy paste the following code to install Git, according to your Operating System:

Windows
```bash
winget install --id Git.Git -e --source winget
```
On Windows, once Git is installed, close VS Code completely and reopen it, so that the terminal can find Git.

Mac OS
```bash
xcode-select --install
```
Linux (Debian/Ubuntu)
```bash
sudo apt install git
```

Once installed, verify the installation:

```bash
git --version
```
![Git Version](images/prelude-git-version.png)
*Git Installed*

Now, configure it by setting a name and email, using the same as you've used to set up your GitHub account

```bash
git config --global user.name "Your GitHub username"
git config --global user.email "you@example.com"
```

### Step 4 - Download the Book Repo

Now, head to this course's [repository](https://github.com/gillo7/Book), and download the zip folder containing all the chapters, code and challenges you will need to work through the practical exercises.

![Download Repo Zip](images/prelude-repo-download-zip.png)
*Download the Zip of the repo*

Once downloaded, unzip it, rename it what you want, and place it somewhere sensible (Documents, Desktop, wherever you can find it again!)

Now, head back to VS Code, and select File, Open Folder.. and select the repo's folder.

The left hand side panel will show you all the contents of the folder, and opening a new terminal now should have it already working in that folder!

This folder is now yours, and you will be able to add notes, fill in your attempts at the practicals and save your own programs, modify or add your own code, upload your cool programs, and record your progress!
And to keep everything safe, we're now going to upload it into your very own repo on your own GitHub account!

### Step 5 - Uploading your repo

Now, click on the Branching icon on the left hand side of VS Code panels

![Branch and pushing to GitHub](images/prelude-vscode-publish-github.png)
*Initialize Repository and Publish it to GitHub*

First, we need to turn this folder into a git repository. Click Initialize Repository.

All the files of the book now appear as changes. Type a message, for example "First commit", and click Commit (say yes if VS Code asks whether to stage all your changes).

Now click Publish Branch, and choose a private repository: this copy will contain your own work, so keep it to yourself, you can always invite friends or colleagues for cooperative work!

VS Code will prompt you to sign in to GitHub, click Allow and authorise VS Code. The browser will bring you back to VS Code and the publish will carry on. From now on, VS Code will remember that this folder is linked to your GitHub account.

If it fails to authenticate the first time, don't worry, just publish again: it usually works the second time.

Now, every time you want to save your work to GitHub:

1. In the same Source Control panel, type a short message describing what you did (git will not accept a commit without one!), for example "Chapter 1 practical done"
2. Click the little arrow next to the Commit button, and choose Commit & Sync

That's it, your work is committed and uploaded in one go. Do this as many times and as often as you want.

The first time, VS Code may ask whether to stage all your changes, and warn you that it will pull and push commits. Say yes to both, and tick "Don't Show Again" if you're offered it.

### Step 6 - VS Code, Markdown and adding your notes

What follows are optional tips and tricks of the trade to make your life easier when working on VS Code and using Markdown.

When you open a chapter .md file you can immediately notice that the text seems a bit strange? Normal, VS Code is showing you the code source. But press **Control+Shift+V** (Command+Shift+V on a Mac) and you will actually see the text as it is meant to be seen! Press it again if you ever need to add/modify any of the text. Alternatively, especially if you have two screens, you can have the text open on GitHub on one side, and the .md source code to modify on the other. Remember to push your changes!

Markdown is a very simple way to write and save text. It is recognisable by the .md file extension, and as you probably noticed, is used for all the textual contents of the repo. Feel free to explore Markdown further, it is a brilliant thing, but essentially to add your notes and complete exercises efficiently, you should just know the following:

Using `#` makes a title, more `#`s make the title smaller, it is usually used to do title/chapter/section/subsections.

Using `*` around text makes it italic, using `**` around text makes it bold.

Using the backtick around text makes it `code`

Using three backticks in between separate lines makes it several lines of code
```python
if 2 > 1:
    print("Hello World!")
else:
    print("two is always bigger than one")
```
and you can substitute bash for python, java, etc depending on which programming language you use. And it'll automatically be possible to copy it, and the colouring scheme will change accordingly. Pretty neat!

And if you want to add your own notes within the course? 
Just use `>` in front of your line and it'll appear in a separate box.

>This is my comment

There are many more options, especially if you include HTML tags, but this will suffice for now.

## Part 2 - Installing and connecting to your Ubuntu VM

In this second part, we're going to install and configure a Linux virtual machine that will then be used for all our practical cryptography and networking exercises.

### Step 1 - Installing Virtual Box

The first step is to collect a Hypervisor. A hypervisor is a software, installed on your machine, that will be able to run a completely different machine on it. This is the core technology that runs all the Cloud! We're not going to go as far though. We will just install and configure one machine to do all our experiments on it!

For our hypervisor, we will use VirtualBox. It is an open-source, free to use software which we will use to virtualise our Linux box. (A box, in IT-talk, means a computer. It dates back from when computers commonly looked like large boxes.)

Head to [VirtualBox](https://www.virtualbox.org/wiki/Downloads)

![VirtualBox downloads page](images/prelude-vbox-download-page.png)
*The VirtualBox downloads page: pick the package for your computer*

You only need the platform package for your computer, not the Extension Pack.

Now you can download and install it. It conveniently should work on pretty much every hardware and OS combination. 

![VirtualBox Manager](images/prelude-vbox-manager.png)
*VirtualBox Manager, first launch*

### Step 2 - Getting the Ubuntu image

We have our hypervisor ready, now we need an OS image. The hypervisor gives us the ram, the cpu, the storage, but no computer can run without an Operating System (OS) (well, technically, microcontrollers do, but you'll find out more about that at the end of the book). You are using an OS just now reading this. Probably Windows. Or maybe MacOS? For our work, we will be using Linux. The story and importance of Linux cannot be overstated and if you are unfamiliar with it, we can only recommend some further reading to find out more, it is fascinating stuff!

In our specific case, we are going to use a distro (a short-hand for distribution, a variant if you like), of the type Debian (one of the families of variants): Ubuntu. The main reasons are: we are very familiar with it, it is beginner friendly, it comes with our most important tool included (OpenSSL, remember that name), and is very well supported and widely available.

And because nothing is simple, we are actually going to select a specific version: a headless Ubuntu Server 26.04 LTS.

The reason is twofold: It is a long term serviced (LTS) version, which means it will be supported at least until 2031, which means that I won't have to update this part of the repo every year. Secondly, headless does not mean decapitated, it means that it is very light, because it doesn't have a graphic user interface (GUI)! This might be a bit disconcerting if you have never used the command line before. Don't worry about it, this guide will show you how to work it out! The main reason behind this choice is that you won't need much RAM, CPU cores or storage to run this, and so even an older laptop or a tired uni desktop computer will still be perfectly able to run all our experiments! 

So now we need to download the Ubuntu image. (.iso file) Which image? It depends on your computer's processor:

| Your computer | Image | Download |
|---|---|---|
| Windows or Linux PC, Intel Mac | amd64 | [Ubuntu Server](https://ubuntu.com/download/server) |
| Apple Silicon Mac (M1 and later) | arm64 | [Ubuntu Server for Arm](https://ubuntu.com/download/server/arm) |

Not sure which Mac you have? Apple menu > About This Mac: "Chip: Apple M..." means Apple Silicon.

![Ubuntu Server download page](images/prelude-ubuntu-download-page.png)
*Ubuntu Server Download Page*

### Step 3 - Configuring the VM and the Network

We have our hypervisor, we have our image, now let's do some computer magic! 


![VirtualBox Manager, no VM yet](images/prelude-vbox-manager-empty.png)
*Virtual Box*

Open VirtualBox and click Machine>New (or Ctrl+N). Give your VM a name (Crypto-Lab-Ubuntu, say), and select the Ubuntu image you have just downloaded as the ISO Image.

Important: tick Skip Unattended Installation! Otherwise VirtualBox will install Ubuntu for you, and skip options we need.

![New VM, name and ISO image](images/prelude-vm-name-iso.png)
*Creating your new Virtual Machine*

You will need to select a few options before running your virtual machine (VM) for the first time. Essentially, this is the process of telling the hypervisor exactly how much of your computer resources you are ready to share with the newly spawned machine. Because we chose a headless box, you can keep it quite small so it will run without impacting your day-to-day work on your machine.

Look at the following table for which recommended specs might fit your machine best.

| Your computer's RAM | VM RAM | CPUs | Disk |
|---|---|---|---|
| 8 GB | 2048 MB | 1 | 20 GB |
| 16 GB | 2048 MB | 2 | 25 GB |
| 32 GB or more | 4096 MB | 2-4 | 25 GB |

Don't worry about the disk size: the virtual disk only grows as it fills up, it won't take the full 25 GB straight away.

![VM hardware, RAM and CPUs](images/prelude-vm-ram-cpu.png)
*RAM and CPUs*

![VM virtual hard disk](images/prelude-vm-disk.png)
*VM virtual hard disk*

![VM summary](images/prelude-vm-summary.png)
*VM Summary*

Now, do not start the machine quite yet. A computer is not very useful if it cannot communicate! We need to set up the networking rules. 

![VM created](images/prelude-vm-created.png)
*VM created*

For our work, we will need effectively two connections: a NAT (Network Address Translation) where VirtualBox acts as a router connecting our VM to the internet, and a Host-Only network which will create a private network between your machine and our new box. This will be very important for many exercises later on, so don't worry if you're not exactly clear about what it means, just follow the steps described below.

First, right click on your VM and select settings, in settings, open the Network option.

![Network settings, Adapter 1 NAT](images/prelude-vm-network-nat.png)
*Network Settings*

You should see NAT being there, good, leave it as it is! Now, select Adapter 2, Tick Enable Network Adapter and Attached to: Host-Only Adapter. Leave the name of the network (vboxnet0) as it is, and no need to change anything in the Advanced tab.

![Adapter 2, Host-only Adapter](images/prelude-vm-network-hostonly.png)
*Host-Only Adapter settings*

Click OK to save.

Now that we have configured everything we need with the hypervisor, we need to give life to our new creation, let's start our Ubuntu machine!

### Step 4 - Installing Ubuntu

And now press start. It always does something the first time. Or maybe it is just me?

You will arrive in the setup of your new machine. 


![Installer, first start](images/prelude-install-first-start.png)
*First start*

Let Ubuntu initialise, then select the language, and the keyboard layout.

![Installer, language](images/prelude-install-language.png)
*Language selection*

Choose Ubuntu Server, the default that's already selected, and leave Search for third-party drivers unticked.

![Installer, type of installation](images/prelude-install-type.png)
*Choose the type of installation*

In the Network configuration, you should see the two networks adapters we have setup earlier. This is the right moment to write down the Virtual Machine's IP address, you will need it later. It is the 192.168.56.x

Remember, if you are in VScode, you can use Ctrl+Shift+V to switch to edit mode, and use `>` to add your own comments, and you can add the IP address here directly! Then revert back to read-mode with Ctrl+Shift+V again. This is your repo, so modify anything you like!

![Installer, network, two interfaces listed](images/prelude-install-network.png)
*Network, two interfaces listed*

Once you've noted the 192.168.56.x IP address, press enter, and skip the proxy configuration, and at the storage configuration page, go down to "Done" and press Enter (It might be below your visible screen, just scroll down).

![Installer, storage configuration](images/prelude-install-storage.png)
*Storage configuration*

Then Enter again and select Continue

![Installer, confirm and start installation](images/prelude-install-confirm.png)
*Starting installation process*

Then fill in the details. For convenience's sake, I'd suggest using easy to remember credentials, because until the chapter on Symmetric Keys, you will need to type in the password often. Make sure you write your username and password down!

![Installer, profile configuration](images/prelude-install-profile.png)
*Profile Configuration*

Then skip the upgrade to Ubunto pro and continue. Make sure to Install OpenSSH server tick is on, and keep it with "Allow password authentication over SSH" (We will set it up with keys, but later in the course.)

![Installer, SSH configuration](images/prelude-install-ssh.png)
*SSH configuration*

Then leave everything unticked in the Featured server snaps, we do not need any of them. Done and Enter.

And the installation will take place. We're almost there! Once the installation is complete, select Reboot now.

![Installer, installation complete](images/prelude-install-complete.png)
*Installation complete!*

When prompted to remove the installation medium, just press enter. The machine will boot for the first time and prompt you to login. Just use the credentials used in the installation (username/password)

![First login on the console](images/prelude-first-login.png)
*First Login*

Now you can shutdown the VM, because we will access it remotely from now on. So just type: 

```bash
sudo poweroff
```

And give your password when prompted.

And you'll be back to the VirtualBox menu. 

From now on, you can start your VM without its window: right-click the VM, then Start > Headless Start. This will launch the machine, but without the screen.

### Step 5 - Connecting to the VM via SSH

A new computer lives on your machine now! Awesome. But going into VirtualBox, opening the console, it is not really convenient. Don't worry, we have you covered.

SSH is a remote-control protocol. It effectively replaces Telnet (which was unencrypted and therefore tragically insecure) and is the protocol we will use to connect to our VM directly from VS Code!

If you forgot to write down your IP address during the installation process, follow the following steps to find your IP again.

First, you will need the VM's private IP address. Launch the virtual machine normally - Normal Start- (not headless) and From the VirtualBox VM's console, after logging in, use:

```bash
ip addr
```
To find out which address was allocated to your VM.

You'll see several addresses. Ignore lo (127.0.0.1) and the one starting with 10.0.2 (that's the NAT). The one you want starts with 192.168.56.x

![ip addr output](images/prelude-ip-addr.png)
*ip addr output*

So this time make sure you write it down, and then power off the machine and re-start it headless.

Now, open VS Code, open the Repo's folder, and open a new terminal. In it, type:

```bash
ssh <username>@<vm_ip>
```

Type yes to the prompt, then type in the password you created when setting up Ubuntu, and if all went well.. you're in! You no longer need the console, every time we will interact with your VM, we will simply SSH into it. Later on we will swap the password for a set of keys, but at the moment this will do.

![First ssh, fingerprint prompt](images/prelude-first-ssh.png)
*First SSH into the VM*

![Logged in to the VM over ssh](images/prelude-ssh-logged-in.png)
*We're in!*

Now, unless troubleshooting, we will not need the VirtualBox console, all the work we will do in the labs will be accessed via SSH and the Terminal (VScode or detached).

### Step 6 - Verifying connectivity and updates

Now that you are connected via SSH, you should start by updating and upgrading Ubuntu, to make sure that you have all the security features... and that you can connect to the internet via your host machine.

```bash
sudo apt update && sudo apt upgrade -y
```

If the upgrade mentions a new kernel or a reboot, run `sudo reboot`, wait a minute and ssh back in. Losing the connection is normal here.

This is it, now you can write and save your first program on your new machine!

### Step 7 - Creating a Python program

In your ssh session, in VS Code's terminal (not the VirtualBox console), open a text editor (nano being the simplest):

```bash
nano hello_world.py
```

Type in 

```python
print("Hello World!")
```

Then press Ctrl + O, enter to save, Ctrl + X to exit (Ctrl, even on a Mac)

And now launch your program:

```bash
python3 hello_world.py
```

And your program should display the message!

![Hello World program output](images/prelude-hello-world.png)
*Hello World!*

There are hundreds of Linux tutorials out there if you would like to find out more about the commands. 

As for us, well, we have our workbench and our Linux machine ready to work! Remember to start the machine in headless mode in VirtualBox every time you are doing the exercises.

And when you've finished, shut it down properly:

```bash
sudo poweroff
```

## Conclusion

In this Prelude, we have set up a GitHub repository with the course's contents, we have installed and connected VScode and Git, we have learned a little about .md and the way to navigate between Read-Only and editable course text (Ctrl+Shift+V) in VScode. Then we have created an entire new Virtual Machine Ubuntu Linux and accessed it via the terminal in VScode. We're ready for chapter 1!

And now, let's talk Cryptography!

