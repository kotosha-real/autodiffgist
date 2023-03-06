# Autodiffgist

Create gists of staged changes from console with just one command 🚀

## Motivation

I write articles on the [Medium](https://kotosha.medium.com/).

I found out that it's quite tedious to make a gist for each change in the code by hand and that it's very inconvenient to paste the files as is (just compare these two articles ([1](https://javascript.plainenglish.io/how-to-create-your-own-cli-with-node-js-9004091a64d5) and [2](https://javascript.plainenglish.io/how-to-create-your-own-cli-with-node-js-7646a976f8fa)) in terms of ease of understanding code changes from step to step).

So I wrote this little package to do all the hard work for me. It creates gists with one or more files depending on the current state of the git stage:

-   First, add all files in the current working directory to the stage with `git add .`
-   Then use `git diff` and `tail` to create nicely formatted diff files for each modified file in the stage
-   Finally, create a gist with all non-empty added and modified files with `gh create gist`

## How to use it

### Setup

First, make sure that you have Github CLI installed and that you are logged in. Follow this [manual](https://cli.github.com/manual/) if it's not the case.

After that, install Autodiffgist globally:

```
npm i @kotosha/autodiffgist -g
```

### Usage

Simply use `autodiffgist` command in any folder containing git repo:

```
autodiffgist
```

If you get an error `command not found: autodiffgist` it means npm could not find global packages. In this case, use `npx` instead:

```
npx autodiffgist
```

### Options

Autodiffgist respects [all options](https://cli.github.com/manual/gh_gist_create) from `gh gist create` command except for `-f`.

Also, you can add `-v` (`--verbose`) option to prevent suppressing basic logs. Without it, you'll only get chalk-colored Autodiffgist logs.

Other options are not allowed and will result in a parse error.

### Warnings and errors

-   **WARN** _Empty files can not be added to gist: {name}_ — there is empty staged file that will not be added to gist
-   **WARN** _There are no files to create gist with_ — pretty self-explanatory. There are no non-empty staged files with statuses `Added` (`A`) or `Modified` (`M`)
-   **ERR** _Could not parse arguments_ — Autodiffgist could not parse arguments, please check [Options](#options) section
-   **ERR** _There are no GitHub CLI installed or you are not logged in. Please, follow this manual before using Autodiffgist: https://cli.github.com/manual/_ — make sure you followed [Setup](#setup) section
-   **ERR** _Can not read diff status file {path}: {err}_ — Autodiffgist pipes output of the `git diff` command to the temporary file. If you encounter this error, this was not performed correctly, therefore considered a bug. Please file an issue
-   **ERR** _Can not read added file {path}: {err}_ — Autodiffgist could not read the stage file with `Added` status to determine whether it's empty. It should be considered a bug. Please file an issue
-   **ERR** _Could not create gist: {stderr}_ — command `gh gist create` returned non-zero exit code. `stderr` log might be helpful to understand what is going on since this is not the problem related to Autodiffgist

## Contribution

It's highly unlikely that I will develop this package further due to the motivation behind its development. If it suits your needs and you want to implement some features, please fork it and develop it on your own or send pull requests 🤝🏻
