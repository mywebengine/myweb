#!/usr/bin/perl -w

my $v = '0.9.2';
my $in = "./";

my %import;
my $index = "";

go("");

my $out = './myweb.min.js';

open(my $fh, ">$out") || die;
my @imports;
while (my ($url, $data) = each(%import)) {
#	$data =~ s!\\!\\\\!g;
#	$data =~ s/\r*\n/\\\\n/g;
#	$data =~ s/'/\\'/g;
	push(@imports, sprintf('["%s", %s]', $url, $data));
}
print $fh '/*!
 * myweb v'.$v.'
 * (c) 2019-2021 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */
(() => {
	const __imports = new Map(['.join(",\n", @imports).']),
		__modules = new Map(),
		initModule = (url, __parent) => {
			if (modules.has(url) || __parent.has(url)) {
				return;
			}
			__parent.add(url);
			const mm = imports.get(url);
			if (mm.init) {
				mm.init(__parent);
			}
console.log(11, url, modules);
			modules.set(url, wrapModule(mm.load()));
		},
		__import = (url, __parent, cb) => {
			const m = __parent.get(url);
			if (m !== undefined) {
				m.push(cb);
				return;
			}
			const after = [];
			__parent.set(url, after);
			const mm = __imports.get(url)(__parent);
			if (c !== undefined) {
				cb(mm);
			}
			for (const i of after) {
				i(mm);
			}
			__parent.delete(url);
		};
	__import("/myweb.js", new Map());
})()';
close($fh);

#`npx uglifyjs --mangle $out -o $out.min` || die;

sub go {
	my ($dir) = @_;
	opendir(my $dh, "$in/$dir") || die;
	foreach my $idir (readdir($dh)) {
		next if ($idir eq '.' || $idir eq '..' || $idir eq 'examples');
		my $ifile = "$dir/$idir";
		my $ff = "$in/$ifile";
		$ff =~ s!/+!/!g;
		if (-d $ff) {
			if ($ff ne './cmd' && $ff ne './render') {
				next;
			}
print "dir => $ifile\n";
			go($ifile);
			next;
		}
		if ($ifile !~ /\.js$/ || $ifile eq '/myweb.min.js') {
			next;
		}
print "file => $ifile\n";
		my $cnt = `npx uglifyjs --compress --mangle -- $ff`;#--compress
		chomp($cnt);
		my $top = $ifile;
		if ($top =~ /\//) {
			$top =~ s!(.*/).+!$1!;
		} else {
			$top = '';
		}
		my @imports;
		my @lets;
		my @exports;
		while ($cnt =~ s/import\s*([`'"])(.+?)\1(;|\r*\n|$)//) {
			push(@imports, sprintf('__import("%s",__parent)', normalize_url($2, $top)));
		}
		while ($cnt =~ s/import\s*(.+?)\s*from\s*([`'"])(.+?)\2(;|\r*\n|$)//) {
			my $def = $1;
			my $url = normalize_url($3, $top);
			my $deps;
			if ($def =~ s/\{(.*?)\}//) {
				$deps = $1;
			}
			$def =~ s/(^\s+|\s+$)//g;
			if ($def && $deps) {
				my @deps = split(/\s*,\s*/, $deps);
				push(@lets, $def, @deps);
				push(@imports, sprintf('__import("%s",__parent,m=>{%s)})', $url, set_lets($def, @deps)));
			} elsif ($def) {
				push(@lets, $def);
				push(@imports, sprintf('__import("%s",__parent,m=>{%s})', $url, set_lets($def)));
			} elsif ($deps) {
				my @deps = split(/\s*,\s*/, $deps);
				push(@lets, @deps);
				push(@imports, sprintf('__import("%s",__parent,m=>{%s})', $url, set_lets(undef, @deps)));
			}
		}
		if ($cnt =~ s/export\s+default\s+(.+?)(\(|;|$)/const __default=$1$2/) {
			push(@exports, "__default");
		}
		while ($cnt =~ s/export\s+(let|const|function|async\s+function)\s+(.+?)(\s|=|\[|\(|;|$)/$1 $2$3/) {
			push(@exports, $2);
		}
		if (@lets) {
			$cnt = sprintf('__parent=>{let %s;%s;%s;return {%s}}', join(',', @lets), join(';', @imports), $cnt, join(',', @exports));
		} elsif (@imports) {
			$cnt = sprintf('__parent=>{%s;%s;return {%s}}', join(';', @imports), $cnt, join(',', @exports));
		} else {
			$cnt = sprintf('__parent=>{%s;return {%s}}', $cnt, join(',', @exports));
		}
		$import{$ifile} = $cnt;
#		if ($ifile eq '/myweb.js') {
#			$index = $cnt;
#			next;
#		}
#		$import{$ifile} = 'data:text/javascript;text,'.$cnt;
	}
}
sub set_lets {
	my ($def, @deps) = @_;
	my @str;
	if ($def) {
		push(@str, "$def=m.__default");
	}
	if (@deps) {
		foreach my $i (@deps) {
			push(@str, "$i=m.$i");
		}
	}
	join(';', @str);
}
sub normalize_url {
	my ($url, $top) = @_;
	if ($url !~ /^\//) {
		$url = $top.$url;
	}
	$url =~ s!(/\./|/+)!/!g;
	$url =~ s![^/]+/\.\./!!g;
	$url;
}
